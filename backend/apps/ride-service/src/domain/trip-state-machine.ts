import { BadRequestException } from '@nestjs/common';
import { TripStatus, VALID_TRIP_TRANSITIONS } from '@taxi/database';

export class TripStateMachine {
  canTransition(from: TripStatus, to: TripStatus): boolean {
    return VALID_TRIP_TRANSITIONS[from]?.includes(to) ?? false;
  }

  transition(from: TripStatus, to: TripStatus): TripStatus {
    if (!this.canTransition(from, to)) {
      throw new BadRequestException(
        `Invalid trip transition: ${from} → ${to}`,
      );
    }
    return to;
  }
}
