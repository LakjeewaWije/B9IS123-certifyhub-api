const request = require('supertest');
const app = require('./index');
const path = require('path');
var certificateId = '';
var fileName = '';
describe('CertifyHub Api App Tests', () => {

    it('should return that app is up and running', async () => {
        const response = await request(app).get('/');
        expect(response.status).toBe(200);
        expect(response.text).toBe('CertifyHub Api Up And Running...');
    });

    it('should create new certificate', async () => {

        const category = 'Academic';
        const dateAwarded = new Date().toISOString();
        const description = 'This is a test description';
        const name = 'Test Certificate';
        const filePath = path.join(__dirname, 'test-upload.pdf');

        const response = await request(app)
            .post('/certificate/add')
            .field('category', category)
            .field('dateAwarded', dateAwarded)
            .field('description', description)
            .field('name', name)
            .attach('uploaded_file', filePath)
            .set('userId', '-ODsY5K5RDJ1DT4pWM3c');
        expect(response.status).toBe(200);
        expect(response._body.message).toBe('Certificate Added');
    });

    it('should get created certificates', async () => {
        const response = await request(app)
            .get('/certificate/get/all')
            .set('userId', '-ODsY5K5RDJ1DT4pWM3c');
        expect(response.status).toBe(200);
        expect(response._body.data[0].name).toBe('Test Certificate');
        certificateId = response._body.data[0].certificateId
        fileName = response._body.data[0].fileName
    });

    it('should update the certificate', async () => {

        const category = 'Academic';
        const dateAwarded = new Date().toISOString();
        const description = 'This is a test description';
        const name = 'Test Certificate Updated';

        const response = await request(app)
            .put('/certificate/update')
            .field('category', category)
            .field('dateAwarded', dateAwarded)
            .field('description', description)
            .field('name', name)
            .field('certificateId', certificateId)
            .field('fileName', fileName)
            .set('userId', '-ODsY5K5RDJ1DT4pWM3c');
        expect(response.status).toBe(200);
        expect(response._body.message).toBe('Certificate Updated');
    });

    it('should get updated certificates', async () => {
        const response = await request(app)
            .get('/certificate/get/all')
            .set('userId', '-ODsY5K5RDJ1DT4pWM3c');
        expect(response.status).toBe(200);
        expect(response._body.data[0].name).toBe('Test Certificate Updated');
        certificateId = response._body.data[0].certificateId
    });

    it('should delete certificate', async () => {
        const response = await request(app)
            .delete(`/certificate/${certificateId}/remove`)
            .set('userId', '-ODsY5K5RDJ1DT4pWM3c');
        expect(response.status).toBe(200);
        expect(response._body.message).toBe('Certificate removed');
    });
});
