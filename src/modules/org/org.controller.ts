import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common'
import { OrgService } from './org.service'
import { OrgStructureService } from './org-structure.service'
import { OrgMemberService } from './org-member.service'
import { CreateOrgDto } from './dto/create-org.dto'
import { UpdateOrgDto } from './dto/update-org.dto'
import { CreateStructureDto } from './dto/create-structure.dto'
import { UpdateStructureDto } from './dto/update-structure.dto'
import { CreateMemberDto } from './dto/create-member.dto'
import { UpdateMemberDto } from './dto/update-member.dto'
import { ZodPipe } from 'src/libs/zod2'
import type { OrgVo, OrgStructureVo, OrgMemberVo } from './vo/org.vo'

@Controller('org')
export class OrgController {
    constructor(
        private readonly orgService: OrgService,
        private readonly structureService: OrgStructureService,
        private readonly memberService: OrgMemberService
    ) {}

    // ==================== 组织 ====================

    @Post()
    create(@Body(new ZodPipe()) dto: CreateOrgDto): OrgVo {
        return this.orgService.create(dto)
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.orgService.remove(+id)
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body(new ZodPipe()) dto: UpdateOrgDto) {
        return this.orgService.update(+id, dto)
    }

    @Get()
    findAll(): OrgVo {
        return this.orgService.findAll()
    }

    @Get('page')
    findPage(@Query('page') page: string = '1', @Query('limit') limit: string = '10'): OrgVo {
        return this.orgService.findPage(Number(page), Number(limit))
    }

    @Get(':id')
    findOne(@Param('id') id: string): OrgVo {
        return this.orgService.findOne(+id)
    }

    // ==================== 组织架构节点 ====================

    @Post('structure')
    createStructure(@Body(new ZodPipe()) dto: CreateStructureDto): OrgStructureVo {
        return this.structureService.create(dto)
    }

    @Delete('structure/:id')
    removeStructure(@Param('id') id: string) {
        return this.structureService.remove(+id)
    }

    @Get('structure')
    findAllStructures(): OrgStructureVo {
        return this.structureService.findAll()
    }

    @Get('structure/:id')
    findStructureById(@Param('id') id: string): OrgStructureVo {
        return this.structureService.findOne(+id)
    }

    @Patch('structure/:id')
    updateStructure(@Param('id') id: string, @Body(new ZodPipe()) dto: UpdateStructureDto) {
        return this.structureService.update(+id, dto)
    }

    // ==================== 组织成员 ====================

    @Post('member')
    createMember(@Body(new ZodPipe()) dto: CreateMemberDto): OrgMemberVo {
        return this.memberService.create(dto)
    }

    @Delete('member/:id')
    removeMember(@Param('id') id: string): OrgMemberVo {
        return this.memberService.remove(+id)
    }

    @Patch('member/:id')
    updateMember(@Param('id') id: string, @Body(new ZodPipe()) dto: UpdateMemberDto): OrgMemberVo {
        return this.memberService.update(+id, dto)
    }

    @Get('member')
    findAllMembers(): OrgMemberVo {
        return this.memberService.findAll()
    }

    @Get('member/:id')
    findMemberById(@Param('id') id: string): OrgMemberVo {
        return this.memberService.findOne(+id)
    }
}
