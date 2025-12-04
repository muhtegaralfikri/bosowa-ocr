import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDeleteRequestDto } from './dto/create-delete-request.dto';
import { DeleteRequest, DeleteRequestStatus } from './delete-request.entity';
import { Letter } from '../letters/letter.entity';

@Injectable()
export class DeleteRequestsService {
  constructor(
    @InjectRepository(DeleteRequest)
    private readonly deleteRequestsRepo: Repository<DeleteRequest>,
    @InjectRepository(Letter)
    private readonly lettersRepo: Repository<Letter>,
  ) {}

  async create(letterNumber: string, dto: CreateDeleteRequestDto) {
    const letter = await this.lettersRepo.findOne({ where: { letterNumber } });
    if (!letter) {
      throw new NotFoundException('Letter not found');
    }

    const request = this.deleteRequestsRepo.create({
      letterId: letter.id,
      letter,
      reason: dto.reason,
      status: DeleteRequestStatus.PENDING,
    });
    return this.deleteRequestsRepo.save(request);
  }

  findAll() {
    return this.deleteRequestsRepo.find({
      relations: ['letter'],
      order: { createdAt: 'DESC' },
    });
  }

  async approve(id: string) {
    const request = await this.findOne(id);
    request.status = DeleteRequestStatus.APPROVED;
    return this.deleteRequestsRepo.save(request);
  }

  async reject(id: string) {
    const request = await this.findOne(id);
    request.status = DeleteRequestStatus.REJECTED;
    return this.deleteRequestsRepo.save(request);
  }

  private async findOne(id: string) {
    const found = await this.deleteRequestsRepo.findOne({ where: { id } });
    if (!found) {
      throw new NotFoundException('Delete request not found');
    }
    return found;
  }
}
