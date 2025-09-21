import { Test, TestingModule } from '@nestjs/testing';
import { DummyjsonService } from './dummyjson.service';

describe('DummyjsonService', () => {
  let service: DummyjsonService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DummyjsonService],
    }).compile();

    service = module.get<DummyjsonService>(DummyjsonService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
