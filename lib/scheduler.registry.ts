import { Injectable } from '@nestjs/common';
import { CronJob } from 'cron';
import { DUPLICATE_SCHEDULER, NO_SCHEDULER_FOUND } from './schedule.messages';

@Injectable()
export class SchedulerRegistry {
  private readonly cronJobs = new Map<string, CronJob>();
  private readonly cronJobNamespaces = new Map<string, string>();
  private readonly timeouts = new Map<string, any>();
  private readonly intervals = new Map<string, any>();

  runAllCronJobs(namespace = 'global') {
    const allJobs = this.getCronJobs();
    allJobs.forEach((job, jobName) => {
      if (this.cronJobNamespaces.get(jobName) === namespace) {
        job.start();
      }
    });
  }

  stopAllCronJobs(namespace = 'global') {
    const allJobs = this.getCronJobs();
    allJobs.forEach((job, jobName) => {
      if (this.cronJobNamespaces.get(jobName) === namespace) {
        job.stop();
      }
    });
  }

  getCronJobNames(namespace = 'global') {
    const names: string[] = [];
    this.cronJobNamespaces.forEach((v, k) => {
      if (v === namespace) {
        names.push(k);
      }
    });
    return names;
  }

  getCronJob(name: string) {
    const ref = this.cronJobs.get(name);
    if (!ref) {
      throw new Error(NO_SCHEDULER_FOUND('Cron Job', name));
    }
    return ref;
  }

  getInterval(name: string) {
    const ref = this.intervals.get(name);
    if (typeof ref === 'undefined') {
      throw new Error(NO_SCHEDULER_FOUND('Interval', name));
    }
    return ref;
  }

  getTimeout(name: string) {
    const ref = this.timeouts.get(name);
    if (typeof ref === 'undefined') {
      throw new Error(NO_SCHEDULER_FOUND('Timeout', name));
    }
    return ref;
  }

  addCronJob(name: string, job: CronJob, namespace = 'global') {
    const ref = this.cronJobs.get(name);
    if (ref) {
      throw new Error(DUPLICATE_SCHEDULER('Cron Job', name));
    }
    this.cronJobs.set(name, job);
    this.cronJobNamespaces.set(name, namespace);
  }

  addInterval<T = any>(name: string, intervalId: T) {
    const ref = this.intervals.get(name);
    if (ref) {
      throw new Error(DUPLICATE_SCHEDULER('Interval', name));
    }
    this.intervals.set(name, intervalId);
  }

  addTimeout<T = any>(name: string, timeoutId: T) {
    const ref = this.timeouts.get(name);
    if (ref) {
      throw new Error(DUPLICATE_SCHEDULER('Timeout', name));
    }
    this.timeouts.set(name, timeoutId);
  }

  getCronJobs(): Map<string, CronJob> {
    return this.cronJobs;
  }

  deleteCronJob(name: string) {
    const cronJob = this.getCronJob(name);
    cronJob.stop();
    this.cronJobs.delete(name);
    this.cronJobNamespaces.delete(name);
  }

  getIntervals(): string[] {
    return [...this.intervals.keys()];
  }

  deleteInterval(name: string) {
    const interval = this.getInterval(name);
    clearInterval(interval);
    this.intervals.delete(name);
  }

  getTimeouts(): string[] {
    return [...this.timeouts.keys()];
  }

  deleteTimeout(name: string) {
    const timeout = this.getTimeout(name);
    clearTimeout(timeout);
    this.timeouts.delete(name);
  }
}
