import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { join } from 'path';

describe('AnalysisController (e2e)', () => {
    let app: INestApplication;
    let jwtToken: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        // Login to get token
        const loginRes = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ username: 'admin', password: 'password' });

        jwtToken = loginRes.body.access_token;
    });

    afterAll(async () => {
        await app.close();
    });

    it('/analysis/upload (POST) - should analyze XML and return result', async () => {
        // Create a dummy XML content
        const xmlContent = `
        <Module Name="TEST_MODULE">
            <FormModule Name="TEST_FORM">
                <Block Name="TEST_BLOCK">
                    <QueryDataSourceName>TEST_TABLE</QueryDataSourceName>
                    <QueryDataSourceType>Table</QueryDataSourceType>
                    <Item Name="ITEM1"/>
                    <Trigger Name="WHEN-BUTTON-PRESSED">
                        <TriggerText>
                            BEGIN&#10;                            MESSAGE('Hello');&#10;                        END;
                        </TriggerText>
                    </Trigger>
                </Block>
            </FormModule>
        </Module>`;

        const buffer = Buffer.from(xmlContent, 'utf8');

        return request(app.getHttpServer())
            .post('/analysis/upload')
            .set('Authorization', `Bearer ${jwtToken}`)
            .attach('file', buffer, 'test_form.xml')
            .field('projectId', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')
            .expect(201)
            .expect((res) => {
                const body = res.body;
                expect(body).toHaveProperty('id');
                expect(body.moduleName).toBe('TEST_MODULE');
                expect(body.parsedData).toBeDefined();
                expect(body.parsedData.blocks).toHaveLength(1);
                expect(body.parsedData.blocks[0].name).toBe('TEST_BLOCK');
                expect(body.parsedData.blocks[0].dataSource).toBe('TEST_TABLE');
                expect(body.parsedData.triggers).toHaveLength(1);
                // Verify decoding of &#10; to \n
                expect(body.parsedData.triggers[0].code).toContain('BEGIN\n');
                // Verify Parent Block context
                expect(body.parsedData.triggers[0].parentBlock).toBe('TEST_BLOCK');
            });
    });

    it('/governance/register (POST) - should register a service', () => {
        return request(app.getHttpServer())
            .post('/governance/register')
            .set('Authorization', `Bearer ${jwtToken}`)
            .send({
                originalName: 'TEST_PROCEDURE',
                sourceType: 'PROGRAM_UNIT',
                proposedServiceName: 'test-service',
                status: 'PENDING',
                complexity: 'LOW',
                sqlLogic: 'SELECT * FROM DUAL'
            })
            .expect(201)
            .expect((res) => {
                expect(res.body).toHaveProperty('id');
                expect(res.body.originalName).toBe('TEST_PROCEDURE');
            });
    });
});
