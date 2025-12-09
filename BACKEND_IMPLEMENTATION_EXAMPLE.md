# Backend Implementation Examples

This document provides sample code for implementing the required NestJS backend endpoints.

## 1. Auth Module

### auth.controller.ts

```typescript
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: { email: string; password: string }) {
    return this.authService.login(loginDto.email, loginDto.password);
  }
}
```

### auth.service.ts

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from '../schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { email: user.email, sub: user._id };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user._id,
        email: user.email,
      },
    };
  }
}
```

### jwt.strategy.ts

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../schemas/user.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.userModel.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException();
    }

    return { userId: payload.sub, email: payload.email };
  }
}
```

### auth.module.ts

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { User, UserSchema } from '../schemas/user.schema';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION'),
        },
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [JwtStrategy, PassportModule],
})
export class AuthModule {}
```

---

## 2. Images Module

### images.controller.ts

```typescript
import {
  Controller,
  Post,
  Get,
  Query,
  UseInterceptors,
  UploadedFile,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { ImagesService } from './images.service';

@Controller('images')
@UseGuards(AuthGuard('jwt'))
export class ImagesController {
  constructor(private imagesService: ImagesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('title') title: string,
    @Body('category') category: string,
    @Request() req,
  ) {
    return this.imagesService.uploadImage(
      file,
      title,
      category,
      req.user.userId,
    );
  }

  @Get()
  async getImages(@Query('category') category?: string, @Request() req?) {
    return this.imagesService.getImages(req.user.userId, category);
  }
}
```

### images.service.ts

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import { Image } from '../schemas/image.schema';

@Injectable()
export class ImagesService {
  constructor(
    @InjectModel(Image.name) private imageModel: Model<Image>,
    private configService: ConfigService,
  ) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadImage(
    file: Express.Multer.File,
    title: string,
    category: string,
    userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!title || !category) {
      throw new BadRequestException('Title and category are required');
    }

    const validCategories = [
      'Nature',
      'Animals',
      'People',
      'Architecture',
      'Other',
    ];
    if (!validCategories.includes(category)) {
      throw new BadRequestException('Invalid category');
    }

    try {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'image-gallery',
            resource_type: 'auto',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        );

        uploadStream.end(file.buffer);
      });

      const cloudinaryResult = result as any;

      const image = new this.imageModel({
        title,
        category,
        imageUrl: cloudinaryResult.secure_url,
        publicId: cloudinaryResult.public_id,
        userId,
      });

      return await image.save();
    } catch (error) {
      throw new BadRequestException('Failed to upload image to Cloudinary');
    }
  }

  async getImages(userId: string, category?: string) {
    const query: any = { userId };

    if (category && category !== 'All') {
      query.category = category;
    }

    return this.imageModel
      .find(query)
      .sort({ createdAt: -1 })
      .exec();
  }
}
```

### images.module.ts

```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ImagesController } from './images.controller';
import { ImagesService } from './images.service';
import { Image, ImageSchema } from '../schemas/image.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Image.name, schema: ImageSchema }]),
    AuthModule,
  ],
  controllers: [ImagesController],
  providers: [ImagesService],
})
export class ImagesModule {}
```

---

## 3. Database Schemas

### schemas/user.schema.ts

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
```

### schemas/image.schema.ts

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Image extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({
    required: true,
    enum: ['Nature', 'Animals', 'People', 'Architecture', 'Other']
  })
  category: string;

  @Prop({ required: true })
  imageUrl: string;

  @Prop({ required: true })
  publicId: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;
}

export const ImageSchema = SchemaFactory.createForClass(Image);
```

---

## 4. App Module Configuration

### app.module.ts

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { ImagesModule } from './images/images.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI),
    AuthModule,
    ImagesModule,
  ],
})
export class AppModule {}
```

---

## 5. Main Configuration

### main.ts

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());

  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });

  await app.listen(3000);
  console.log('Backend running on http://localhost:3000');
}
bootstrap();
```

---

## 6. Create Test User Script

### scripts/create-user.ts

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../src/schemas/user.schema';
import * as bcrypt from 'bcrypt';

async function createUser() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userModel = app.get(getModelToken(User.name));

  const email = 'test@example.com';
  const password = 'password123';

  const existingUser = await userModel.findOne({ email });

  if (existingUser) {
    console.log('User already exists');
    await app.close();
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = new userModel({
    email,
    password: hashedPassword,
  });

  await user.save();

  console.log('Test user created:');
  console.log('Email:', email);
  console.log('Password:', password);

  await app.close();
}

createUser();
```

Run with:
```bash
npx ts-node scripts/create-user.ts
```

---

## 7. Package.json Scripts

Add to your backend `package.json`:

```json
{
  "scripts": {
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main",
    "build": "nest build",
    "create-user": "ts-node scripts/create-user.ts"
  }
}
```

---

## Installation Commands Summary

```bash
# Create NestJS project
npm i -g @nestjs/cli
nest new image-gallery-backend
cd image-gallery-backend

# Install dependencies
npm install @nestjs/mongoose mongoose
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install bcrypt cloudinary multer @nestjs/config
npm install class-validator class-transformer
npm install @types/bcrypt @types/multer @types/passport-jwt --save-dev

# Create .env file with your credentials

# Create test user
npm run create-user

# Start backend
npm run start:dev
```

---

## Testing with cURL

```bash
# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Upload Image (replace YOUR_TOKEN with the token from login)
curl -X POST http://localhost:3000/images/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=Test Image" \
  -F "category=Nature" \
  -F "image=@/path/to/image.jpg"

# Get All Images
curl -X GET http://localhost:3000/images \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get Images by Category
curl -X GET "http://localhost:3000/images?category=Nature" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

This implementation provides a complete, working NestJS backend that integrates perfectly with your React frontend.
