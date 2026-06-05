import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '@safestream/database';
import { NotFoundException } from '@safestream/exceptions';
import { EventsService, Events } from '@safestream/events';
import { PaginationDto, buildPaginatedResponse } from '@safestream/pagination';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @IsString() videoId: string;
  @IsString() @MaxLength(2000) content: string;
  @IsOptional() @IsString() parentId?: string;
}

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment) private readonly commentRepo: Repository<Comment>,
    private readonly events: EventsService,
  ) {}

  async create(dto: CreateCommentDto, userId: string): Promise<Comment> {
    const comment = this.commentRepo.create({ ...dto, userId });
    const saved = await this.commentRepo.save(comment);

    if (dto.parentId) {
      await this.commentRepo.increment({ id: dto.parentId }, 'replyCount', 1);
    }

    await this.events.publish(Events.COMMENT_CREATED, {
      commentId: saved.id,
      videoId: dto.videoId,
      userId,
    });
    return saved;
  }

  async list(videoId: string, parentId: string | null, pagination: PaginationDto) {
    const qb = this.commentRepo
      .createQueryBuilder('comment')
      .where('comment.videoId = :videoId', { videoId })
      .andWhere('comment.isHidden = false');

    if (parentId) {
      qb.andWhere('comment.parentId = :parentId', { parentId });
    } else {
      qb.andWhere('comment.parentId IS NULL');
    }

    qb.orderBy('comment.isPinned', 'DESC').addOrderBy('comment.likeCount', 'DESC');

    const total = await qb.getCount();
    const items = await qb
      .take(pagination.limit)
      .skip(((pagination.page ?? 1) - 1) * pagination.limit)
      .getMany();

    return buildPaginatedResponse(items, total, pagination.limit, undefined, pagination.page);
  }

  async delete(id: string, userId: string, isAdmin = false): Promise<void> {
    const comment = await this.commentRepo.findOneOrFail({ where: { id } });
    if (!isAdmin && comment.userId !== userId) throw new ForbiddenException();
    comment.isHidden = true;
    comment.content = '[removed]';
    await this.commentRepo.save(comment);
  }

  async pin(id: string): Promise<void> {
    // Unpin all others for this video first
    const comment = await this.commentRepo.findOneOrFail({ where: { id } });
    await this.commentRepo.update({ videoId: comment.videoId }, { isPinned: false });
    await this.commentRepo.update(id, { isPinned: true });
  }
}
