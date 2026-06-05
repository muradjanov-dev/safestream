import {
  Controller, Get, Post, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { MessagesService } from '../messages/messages.service';
import { JwtAuthGuard, CurrentUser, RequestUser } from '@safestream/auth';
import { PaginationDto } from '@safestream/pagination';
import { IsString, IsEnum, IsArray, IsOptional } from 'class-validator';

class CreateConversationDto {
  @IsEnum(['direct', 'group']) type: 'direct' | 'group';
  @IsArray() @IsString({ each: true }) participantIds: string[];
  @IsOptional() @IsString() name?: string;
}

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(
    private readonly conversations: ConversationsService,
    private readonly messages: MessagesService,
  ) {}

  @Get()
  async list(@CurrentUser() user: RequestUser) {
    const data = await this.conversations.getUserConversations(user.id);
    return { success: true, data };
  }

  @Post()
  async create(@Body() dto: CreateConversationDto, @CurrentUser() user: RequestUser) {
    const allParticipants = [...new Set([user.id, ...dto.participantIds])];
    const conversation = await this.conversations.create(
      dto.type,
      allParticipants,
      user.id,
      dto.name,
    );
    return { success: true, data: conversation };
  }

  @Get(':id/messages')
  async messages(
    @Param('id') id: string,
    @Query() pagination: PaginationDto,
    @CurrentUser() user: RequestUser,
  ) {
    const isMember = await this.conversations.isParticipant(id, user.id);
    if (!isMember) return { success: false, error: { code: 'FORBIDDEN' } };
    return this.messages.list(id, pagination);
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  async markRead(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    await this.conversations.markRead(id, user.id);
    return { success: true };
  }
}
