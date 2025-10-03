import { Controller, Get, Post, Body, ValidationPipe, UsePipes, UnauthorizedException, UseGuards, } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
//mport { UpdateAuthDto } from './dto/update-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Post('login')
  create(@Body() createAuthDto: LoginDto) {
    return this.authService.login(createAuthDto);
  }

  @Post('logout')
  signout(req, res) {
    try {
      req.session = null;
      return res.status(200).send({
        message: "You've been signed out!"
      });
    } catch (err) {
      //this.next(err);
      return { success: false, message: "Error al logout", error: err }
    }

  }

  
  //getmoderator, getuser, getadmin
  @Get('/all')
  gettest() {
    return "INFORMACION PUBLICA"
  }
  
  @UseGuards(AuthGuard('jwt'))
  @Get('/mod')
  getMod() {
    return "INFORMACION DEL MODERADOR"
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/usr')
  getUser() {
    return "INFORMACION DEL USER"
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/adm')
  getAdmin() {
    return "INFORMACION DEL ADMIN"
  }

  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Post('postest')
  posttest(@Body() createAuthDto: LoginDto) {
    return new UnauthorizedException();
  }

  // @Post()
  // create(@Body() createAuthDto: CreateAuthDto) {
  //   return this.authService.create(createAuthDto);
  // }

  // @Get()
  // findAll() {
  //   return this.authService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.authService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateAuthDto: UpdateAuthDto) {
  //   return this.authService.update(+id, updateAuthDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.authService.remove(+id);
  // }
}
