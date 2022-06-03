import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { SchedulerRegistry } from '../../lib/scheduler.registry';
import { AppModule } from '../src/app.module';
import { CronService } from '../src/cron.service';
import sinon from 'sinon';

const deleteAllRegisteredJobsExceptOne = (
  registry: SchedulerRegistry,
  name: string,
) => {
  Array.from(registry.getCronJobs().keys())
    .filter(key => key !== name)
    .forEach(item => registry.deleteCronJob(item));
};

describe('Cron', () => {
  let app: INestApplication;
  let clock: sinon.SinonFakeTimers;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule.registerCron()],
    }).compile();

    app = module.createNestApplication();
    clock = sinon.useFakeTimers({ now: 1577836800000 }); // 2020-01-01T00:00:00.000Z
  });

  it(`should schedule "cron"`, async () => {
    const service = app.get(CronService);

    expect(service.callsCount).toEqual(0);

    await app.init();
    clock.tick(3000);

    expect(service.callsCount).toEqual(3);
  });

  it(`should run "cron" once after 30 seconds`, async () => {
    const service = app.get(CronService);

    await app.init();
    const registry = app.get(SchedulerRegistry);
    const job = registry.getCronJob('EXECUTES_EVERY_30_SECONDS');
    deleteAllRegisteredJobsExceptOne(registry, 'EXECUTES_EVERY_30_SECONDS');

    expect(job.running).toBeTruthy();
    expect(service.callsCount).toEqual(0);

    clock.tick('30');
    expect(service.callsCount).toEqual(1);
    expect(job.lastDate()).toEqual(new Date('2020-01-01T00:00:30.000Z'));

    clock.tick('31');
    expect(job.running).toBeFalsy();
  });

  it(`should run "cron" 3 times every 60 seconds`, async () => {
    const service = app.get(CronService);

    await app.init();
    expect(service.callsCount).toEqual(0);

    const registry = app.get(SchedulerRegistry);
    const job = registry.getCronJob('EXECUTES_EVERY_MINUTE');
    deleteAllRegisteredJobsExceptOne(registry, 'EXECUTES_EVERY_MINUTE');

    clock.tick('03:00');
    expect(service.callsCount).toEqual(3);
    expect(job.lastDate()).toEqual(new Date('2020-01-01T00:03:00.000Z'));

    clock.tick('03:01');
    expect(job.running).toBeFalsy();
  });

  it(`should run "cron" 3 times every hour`, async () => {
    const service = app.get(CronService);

    await app.init();
    expect(service.callsCount).toEqual(0);

    const registry = app.get(SchedulerRegistry);
    const job = registry.getCronJob('EXECUTES_EVERY_HOUR');
    deleteAllRegisteredJobsExceptOne(registry, 'EXECUTES_EVERY_HOUR');

    clock.tick('03:00:00');
    expect(service.callsCount).toEqual(3);
    expect(job.lastDate()).toEqual(new Date('2020-01-01T03:00:00.000Z'));

    clock.tick('03:00:01');
    expect(job.running).toBeFalsy();
  });

  it(`should return cron id by name`, async () => {
    await app.init();
    const registry = app.get(SchedulerRegistry);
    expect(registry.getCronJob('EXECUTES_EVERY_SECOND')).not.toBeUndefined();
  });

  it(`should add dynamic cron job`, async () => {
    const service = app.get(CronService);
    await app.init();
    service.addCronJob();
    const registry = app.get(SchedulerRegistry);
    expect(registry.getCronJob('dynamic')).not.toBeUndefined();
  });

  it(`should return and start dynamic cron job`, async () => {
    const service = app.get(CronService);
    await app.init();
    const addedJob = service.addCronJob();
    const registry = app.get(SchedulerRegistry);
    const jobs = registry.getCronJobs();

    expect(jobs.get('dynamic')).toEqual(addedJob);

    const job = registry.getCronJob('dynamic');
    expect(job).toBeDefined();
    expect(job.running).toBeUndefined();

    job.start();
    expect(job.running).toEqual(true);

    clock.tick(3000);
    expect(service.dynamicCallsCount).toEqual(3);
  });

  it(`should delete dynamic cron job`, async () => {
    const service = app.get(CronService);
    await app.init();

    service.addCronJob();

    const registry = app.get(SchedulerRegistry);
    let job = registry.getCronJob('dynamic');
    expect(job).toBeDefined();

    registry.deleteCronJob('dynamic');
    try {
      job = registry.getCronJob('dynamic');
    } catch (e) {
      expect(e.message).toEqual(
        'No Cron Job was found with the given name (dynamic). Check that you created one with a decorator or with the create API.',
      );
    }
  });

  afterEach(async () => {
    await app.close();
  });
});
