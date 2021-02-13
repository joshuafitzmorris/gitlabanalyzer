import { Operation } from '@ceres/types';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { Operation as OperationEntity } from './operation.entity';

@Injectable()
export class OperationService {
  constructor(
    @InjectRepository(OperationEntity)
    private readonly operationRepository: Repository<OperationEntity>,
  ) {}

  create(user: User, type: Operation.Type, input: any) {
    const operation = this.operationRepository.create({
      user,
      resource: {
        type,
        owner: user.id,
        status: {
          stage: Operation.Stage.PENDING,
        },
        input,
      },
    });
    return this.operationRepository.save(operation);
  }

  getOldestPending() {
    return this.operationRepository
      .createQueryBuilder()
      .where('resource @> :resource', {
        resource: {
          status: {
            stage: Operation.Stage.PENDING,
          },
        },
      })
      .orderBy('created_at', 'ASC')
      .getOne();
  }
}