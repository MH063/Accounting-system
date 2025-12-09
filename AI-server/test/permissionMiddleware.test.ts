import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import jwt from 'jsonwebtoken';
import { 
  permissionMiddleware, 
  clientFeaturePermission, 
  newFeaturePermission, 
  grayReleasePermission 
} from '../src/middleware/permissionMiddleware';

describe('权限控制中间件测试', () => {
  let req: any;
  let res: any;
  let next: sinon.SinonSpy;

  beforeEach(() => {
    // 模拟请求对象
    req = {
      headers: {},
      params: {}
    };

    // 模拟响应对象
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };

    // 模拟next函数
    next = sinon.spy();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('permissionMiddleware', () => {
    it('应该拒绝没有授权头的请求', () => {
      const middleware = permissionMiddleware('manage_users');
      middleware(req, res, next);

      expect(res.status.calledWith(401)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(next.called).to.be.false;
    });

    it('应该拒绝无效token的请求', () => {
      req.headers.authorization = 'Bearer invalid.token.here';
      const middleware = permissionMiddleware('manage_users');
      middleware(req, res, next);

      expect(res.status.calledWith(401)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(next.called).to.be.false;
    });

    it('应该拒绝没有足够权限的用户', () => {
      // 创建一个学生角色的token
      const studentToken = jwt.sign({ role: 'student' }, 'default_secret');
      req.headers.authorization = `Bearer ${studentToken}`;
      
      const middleware = permissionMiddleware('manage_users');
      middleware(req, res, next);

      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(next.called).to.be.false;
    });

    it('应该允许具有足够权限的用户', () => {
      // 创建一个管理员角色的token
      const adminToken = jwt.sign({ role: 'admin' }, 'default_secret');
      req.headers.authorization = `Bearer ${adminToken}`;
      
      const middleware = permissionMiddleware('manage_users');
      middleware(req, res, next);

      expect(res.status.called).to.be.false;
      expect(res.json.called).to.be.false;
      expect(next.calledOnce).to.be.true;
    });
  });

  describe('clientFeaturePermission', () => {
    it('应该拒绝没有客户端功能控制权限的用户', () => {
      // 创建一个学生角色的token
      const studentToken = jwt.sign({ role: 'student' }, 'default_secret');
      req.headers.authorization = `Bearer ${studentToken}`;
      
      clientFeaturePermission(req, res, next);

      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(next.called).to.be.false;
    });

    it('应该允许具有客户端功能控制权限的用户', () => {
      // 创建一个管理员角色的token
      const adminToken = jwt.sign({ role: 'admin' }, 'default_secret');
      req.headers.authorization = `Bearer ${adminToken}`;
      
      clientFeaturePermission(req, res, next);

      expect(res.status.called).to.be.false;
      expect(res.json.called).to.be.false;
      expect(next.calledOnce).to.be.true;
    });
  });

  describe('newFeaturePermission', () => {
    it('应该拒绝没有新功能发布权限的用户', () => {
      // 创建一个学生角色的token
      const studentToken = jwt.sign({ role: 'student' }, 'default_secret');
      req.headers.authorization = `Bearer ${studentToken}`;
      
      newFeaturePermission(req, res, next);

      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(next.called).to.be.false;
    });

    it('应该允许具有新功能发布权限的用户', () => {
      // 创建一个超级管理员角色的token
      const superAdminToken = jwt.sign({ role: 'super_admin' }, 'default_secret');
      req.headers.authorization = `Bearer ${superAdminToken}`;
      
      newFeaturePermission(req, res, next);

      expect(res.status.called).to.be.false;
      expect(res.json.called).to.be.false;
      expect(next.calledOnce).to.be.true;
    });
  });

  describe('grayReleasePermission', () => {
    it('应该拒绝没有灰度发布控制权限的用户', () => {
      // 创建一个学生角色的token
      const studentToken = jwt.sign({ role: 'student' }, 'default_secret');
      req.headers.authorization = `Bearer ${studentToken}`;
      
      grayReleasePermission(req, res, next);

      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(next.called).to.be.false;
    });

    it('应该允许具有灰度发布控制权限的用户', () => {
      // 创建一个管理员角色的token
      const adminToken = jwt.sign({ role: 'admin' }, 'default_secret');
      req.headers.authorization = `Bearer ${adminToken}`;
      
      grayReleasePermission(req, res, next);

      expect(res.status.called).to.be.false;
      expect(res.json.called).to.be.false;
      expect(next.calledOnce).to.be.true;
    });
  });
});