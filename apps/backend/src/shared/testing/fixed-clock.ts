import { Clock } from '../domain/clock';

export class FixedClock implements Clock {
  constructor(private readonly date: Date) {}

  now(): Date {
    return this.date;
  }
}
