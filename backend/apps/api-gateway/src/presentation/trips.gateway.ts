import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '@taxi/database';

@WebSocketGateway({ namespace: '/trips', cors: { origin: '*' } })
export class TripsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(TripsGateway.name);
  private readonly tripRooms = new Map<string, Set<string>>();

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.slice(7);
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token as string);
      client.data.user = payload;
      if (payload.roles.includes('driver')) {
        client.join(`driver:${payload.sub}`);
      }
      this.logger.log(`Client connected: ${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.data.user?.sub}`);
  }

  @SubscribeMessage('trip:join')
  joinTrip(@ConnectedSocket() client: Socket, @MessageBody() data: { tripId: string }) {
    client.join(`trip:${data.tripId}`);
    return { joined: data.tripId };
  }

  @SubscribeMessage('trip:leave')
  leaveTrip(@ConnectedSocket() client: Socket, @MessageBody() data: { tripId: string }) {
    client.leave(`trip:${data.tripId}`);
    return { left: data.tripId };
  }

  emitTripStatus(tripId: string, status: string, eta?: number) {
    this.server.to(`trip:${tripId}`).emit('trip:status', { tripId, status, eta });
  }

  emitDriverLocation(tripId: string, lat: number, lng: number, heading?: number) {
    this.server.to(`trip:${tripId}`).emit('trip:driver_location', {
      tripId,
      lat,
      lng,
      heading,
      timestamp: Date.now(),
    });
  }

  emitRideOffer(driverUserId: string, offer: Record<string, unknown>) {
    this.server.to(`driver:${driverUserId}`).emit('driver:new_ride', offer);
  }

  broadcastDriverLocation(driverId: string, lat: number, lng: number, heading?: number) {
    this.server.emit('trip:driver_location', {
      driverId,
      lat,
      lng,
      heading,
      timestamp: Date.now(),
    });
  }
}
