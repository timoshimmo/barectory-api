import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ConnectMailModule } from 'src/mail/connect.mail.module';

@Module({
  imports: [ConnectMailModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
