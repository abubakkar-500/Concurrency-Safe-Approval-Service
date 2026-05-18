import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Approvals (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);
    await prisma.approvalRequest.deleteMany();
  });

  afterAll(async () => {
    await prisma.approvalRequest.deleteMany();
    await app.close();
  });

  it('creates and fetches a pending request', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/approvals')
      .send({ title: 'Q1 budget' })
      .expect(201);

    expect(createResponse.body).toMatchObject({
      title: 'Q1 budget',
      status: 'PENDING',
      version: 1,
    });

    const getResponse = await request(app.getHttpServer())
      .get(`/approvals/${createResponse.body.id}`)
      .expect(200);

    expect(getResponse.body.status).toBe('PENDING');
    expect(getResponse.body.version).toBe(1);
  });

  it('approves a pending request and rejects duplicate approve', async () => {
    const { body: created } = await request(app.getHttpServer())
      .post('/approvals')
      .send({ title: 'Duplicate approve test' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/approvals/${created.id}/approve`)
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe('APPROVED');
        expect(res.body.version).toBe(2);
      });

    await request(app.getHttpServer())
      .post(`/approvals/${created.id}/approve`)
      .expect(409);
  });

  it('rejects a pending request', async () => {
    const { body: created } = await request(app.getHttpServer())
      .post('/approvals')
      .send({ title: 'Reject test' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/approvals/${created.id}/reject`)
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe('REJECTED');
        expect(res.body.version).toBe(2);
      });
  });

  it('allows only one winner under concurrent approve attempts', async () => {
    const { body: created } = await request(app.getHttpServer())
      .post('/approvals')
      .send({ title: 'Concurrency test' })
      .expect(201);

    const attempts = 10;
    const responses = await Promise.all(
      Array.from({ length: attempts }, () =>
        request(app.getHttpServer()).post(
          `/approvals/${created.id}/approve`,
        ),
      ),
    );

    const successCount = responses.filter((res) => res.status === 200).length;
    const conflictCount = responses.filter((res) => res.status === 409).length;

    expect(successCount).toBe(1);
    expect(conflictCount).toBe(attempts - 1);

    const finalState = await request(app.getHttpServer())
      .get(`/approvals/${created.id}`)
      .expect(200);

    expect(finalState.body.status).toBe('APPROVED');
    expect(finalState.body.version).toBe(2);
  });
});
