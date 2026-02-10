import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(private jwtService: JwtService) { }

    async validateUser(username: string, pass: string): Promise<any> {
        // STARTING POINT: Hardcoded user for prototype phase
        // TODO: Replace with real database lookup
        const user = { userId: 1, username: 'admin', password: 'password' };

        if (user && user.password === pass) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        const payload = { username: user.username, sub: user.userId };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }
}
