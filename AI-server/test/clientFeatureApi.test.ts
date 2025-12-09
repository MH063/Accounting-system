import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import express from 'express';
import request from 'supertest';
import clientFeatureRoutes from '../src/routes/clientFeatureRoutes';

describe('客户端功能控制API测试', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api', clientFeatureRoutes);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('GET /api/client-features', () => {
    it('应该返回功能模块列表', (done) => {
      request(app)
        .get('/api/client-features')
        .set('Authorization', 'Bearer fake-token')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('data');
          expect(res.body.data).to.be.an('array');
          expect(res.body.data.length).to.be.greaterThan(0);
          
          // 验证第一个功能模块的结构
          const firstFeature = res.body.data[0];
          expect(firstFeature).to.have.property('id');
          expect(firstFeature).to.have.property('name');
          expect(firstFeature).to.have.property('description');
          expect(firstFeature).to.have.property('enabled');
          
          done();
        });
    });
  });

  describe('GET /api/client-features/:id', () => {
    it('应该返回特定功能模块的详细信息', (done) => {
      request(app)
        .get('/api/client-features/1')
        .set('Authorization', 'Bearer fake-token')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('data');
          expect(res.body.data).to.have.property('id', 1);
          expect(res.body.data).to.have.property('name');
          expect(res.body.data).to.have.property('description');
          expect(res.body.data).to.have.property('enabled');
          
          done();
        });
    });
  });

  describe('PUT /api/client-features/:id/status', () => {
    it('应该更新功能模块状态', (done) => {
      request(app)
        .put('/api/client-features/1/status')
        .set('Authorization', 'Bearer fake-token')
        .send({ status: 'enabled' })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('data');
          expect(res.body.data).to.have.property('id', 1);
          expect(res.body.data).to.have.property('status', 'enabled');
          
          done();
        });
    });
  });

  describe('GET /api/client-features/stats', () => {
    it('应该返回功能模块统计信息', (done) => {
      request(app)
        .get('/api/client-features/stats')
        .set('Authorization', 'Bearer fake-token')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('data');
          expect(res.body.data).to.have.property('enabledCount');
          expect(res.body.data).to.have.property('disabledCount');
          expect(res.body.data).to.have.property('warningCount');
          expect(res.body.data).to.have.property('errorCount');
          
          done();
        });
    });
  });

  describe('新功能发布API测试', () => {
    describe('GET /api/new-features', () => {
      it('应该返回新功能列表', (done) => {
        request(app)
          .get('/api/new-features')
          .set('Authorization', 'Bearer fake-token')
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            
            expect(res.body).to.have.property('success', true);
            expect(res.body).to.have.property('data');
            expect(res.body.data).to.be.an('array');
            
            done();
          });
      });
    });

    describe('POST /api/new-features/:id/publish', () => {
      it('应该发布新功能', (done) => {
        request(app)
          .post('/api/new-features/1/publish')
          .set('Authorization', 'Bearer fake-token')
          .send({ strategy: 'full' })
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            
            expect(res.body).to.have.property('success', true);
            expect(res.body).to.have.property('data');
            expect(res.body.data).to.have.property('id', 1);
            expect(res.body.data).to.have.property('status', 'published');
            
            done();
          });
      });
    });
  });

  describe('灰度发布控制API测试', () => {
    describe('GET /api/gray-release-strategies', () => {
      it('应该返回灰度策略列表', (done) => {
        request(app)
          .get('/api/gray-release-strategies')
          .set('Authorization', 'Bearer fake-token')
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            
            expect(res.body).to.have.property('success', true);
            expect(res.body).to.have.property('data');
            expect(res.body.data).to.be.an('array');
            
            done();
          });
      });
    });

    describe('POST /api/gray-release-strategies/:id/start', () => {
      it('应该启动灰度策略', (done) => {
        request(app)
          .post('/api/gray-release-strategies/1/start')
          .set('Authorization', 'Bearer fake-token')
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            
            expect(res.body).to.have.property('success', true);
            expect(res.body).to.have.property('data');
            expect(res.body.data).to.have.property('id', 1);
            expect(res.body.data).to.have.property('status', 'running');
            
            done();
          });
      });
    });
  });
});