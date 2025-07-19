import 'dotenv/config';
import {
  describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import request from 'supertest';
import app from '../../../server.js';
import {
  createCoursesSearchTestSetup,
  cleanupCoursesSearchTest,
} from '../helpers/courses.search.helper.js';

describe('GET /api/courses - Permissions and Boolean Filters Integration', () => {
  let testSetup;

  beforeEach(async () => {
    testSetup = await createCoursesSearchTestSetup();
  });

  afterEach(async () => {
    await cleanupCoursesSearchTest(testSetup.createdCourseIds, testSetup.createdUserIds);
  });

  // Unapproved Course Visibility Tests
  test('should return approved courses plus user own and friend unapproved courses', async () => {
    // Filter by our unique test city to isolate test data
    const res = await request(app)
      .get('/api/courses?city=Unique Test City')
      .set('Authorization', `Bearer ${testSetup.token}`)
      .expect(200);

    expect(res.body.courses).toBeDefined();
    expect(res.body.courses).toHaveLength(2); // user's own + friend's unapproved

    // Should include user's own unapproved course and friend's unapproved course
    const courseIds = res.body.courses.map((course) => course.id);
    expect(courseIds).toContain(`user-unapproved-${testSetup.testId}`);
    expect(courseIds).toContain(`friend-unapproved-${testSetup.testId}`);
    expect(courseIds).not.toContain(`other-unapproved-${testSetup.testId}`);

    // Check that unapproved courses are included
    const userUnapprovedCourse = res.body.courses.find((c) => c.id === `user-unapproved-${testSetup.testId}`);
    expect(userUnapprovedCourse.approved).toBe(false);
    expect(userUnapprovedCourse.submitted_by_id).toBe(testSetup.user.id);

    const friendUnapprovedCourse = res.body.courses.find((c) => c.id === `friend-unapproved-${testSetup.testId}`);
    expect(friendUnapprovedCourse.approved).toBe(false);
    expect(friendUnapprovedCourse.submitted_by_id).toBe(testSetup.friend.id);
  });

  test('should filter by name and include unapproved courses', async () => {
    const res = await request(app)
      .get('/api/courses?name=Friend Unapproved Course')
      .set('Authorization', `Bearer ${testSetup.token}`)
      .expect(200);

    expect(res.body.courses).toHaveLength(1);
    expect(res.body.courses[0].id).toBe(`friend-unapproved-${testSetup.testId}`);
    expect(res.body.courses[0].approved).toBe(false);
  });

  test('should not return other user unapproved courses when no friendship', async () => {
    const res = await request(app)
      .get('/api/courses?name=Other User Course')
      .set('Authorization', `Bearer ${testSetup.token}`)
      .expect(200);

    expect(res.body.courses).toHaveLength(0);
  });

  test('should return different results for friend user', async () => {
    // Test from friend's perspective
    const res = await request(app)
      .get('/api/courses?city=Unique Test City')
      .set('Authorization', `Bearer ${testSetup.friendToken}`)
      .expect(200);

    expect(res.body.courses).toHaveLength(2); // friend's own + user's unapproved

    const courseIds = res.body.courses.map((course) => course.id);
    expect(courseIds).toContain(`user-unapproved-${testSetup.testId}`); // friend can see user's
    expect(courseIds).toContain(`friend-unapproved-${testSetup.testId}`); // friend's own
    expect(courseIds).not.toContain(`other-unapproved-${testSetup.testId}`); // not friend with other
  });

  test('should respect pagination with unapproved courses', async () => {
    const res = await request(app)
      .get('/api/courses?city=Unique Test City&limit=1&offset=0')
      .set('Authorization', `Bearer ${testSetup.token}`)
      .expect(200);

    expect(res.body.courses).toHaveLength(1);
    expect(res.body.total).toBe(2);
    expect(res.body.hasMore).toBe(true);
    expect(res.body.limit).toBe(1);
    expect(res.body.offset).toBe(0);
  });

  test('should combine filters with unapproved course visibility', async () => {
    const res = await request(app)
      .get('/api/courses?city=Unique Test City&stateProvince=TX')
      .set('Authorization', `Bearer ${testSetup.token}`)
      .expect(200);

    expect(res.body.courses).toHaveLength(1);
    expect(res.body.courses[0].id).toBe(`friend-unapproved-${testSetup.testId}`);
    expect(res.body.courses[0].state_province).toBe('TX');
    expect(res.body.courses[0].approved).toBe(false);
  });

  // Boolean filter tests
  test('should filter courses by is_user_submitted=true', async () => {
    const res = await request(app)
      .get('/api/courses?is_user_submitted=true')
      .set('Authorization', `Bearer ${testSetup.token}`)
      .expect(200);

    expect(res.body.courses).toBeDefined();
    expect(res.body.courses.length).toBeGreaterThan(0);

    // All returned courses should be user-submitted
    res.body.courses.forEach((course) => {
      expect(course.is_user_submitted).toBe(true);
    });
  });

  test('should filter courses by is_user_submitted=false', async () => {
    const res = await request(app)
      .get('/api/courses?is_user_submitted=false')
      .set('Authorization', `Bearer ${testSetup.token}`)
      .expect(200);

    expect(res.body.courses).toBeDefined();
    expect(res.body.courses.length).toBeGreaterThan(0);

    // All returned courses should not be user-submitted
    res.body.courses.forEach((course) => {
      expect(course.is_user_submitted).toBe(false);
    });
  });

  test('should filter courses by approved=true', async () => {
    const res = await request(app)
      .get('/api/courses?approved=true')
      .set('Authorization', `Bearer ${testSetup.token}`)
      .expect(200);

    expect(res.body.courses).toBeDefined();
    expect(res.body.courses.length).toBeGreaterThan(0);

    // All returned courses should be approved
    res.body.courses.forEach((course) => {
      expect(course.approved).toBe(true);
    });
  });

  test('should filter courses by approved=false to find user own unapproved courses', async () => {
    const res = await request(app)
      .get('/api/courses?approved=false')
      .set('Authorization', `Bearer ${testSetup.token}`)
      .expect(200);

    expect(res.body.courses).toBeDefined();

    // Should include user's own unapproved courses and friend's unapproved courses
    res.body.courses.forEach((course) => {
      expect(course.approved).toBe(false);
      // Should only see courses from user or friends
      expect([testSetup.user.id, testSetup.friend.id]).toContain(course.submitted_by_id);
    });
  });

  test('should combine is_user_submitted=true and approved=false filters', async () => {
    const res = await request(app)
      .get('/api/courses?is_user_submitted=true&approved=false')
      .set('Authorization', `Bearer ${testSetup.token}`)
      .expect(200);

    expect(res.body.courses).toBeDefined();

    // All courses should be user-submitted AND unapproved
    res.body.courses.forEach((course) => {
      expect(course.is_user_submitted).toBe(true);
      expect(course.approved).toBe(false);
    });
  });

  test('should combine boolean filters with location filters', async () => {
    // Search for user-submitted courses in Unique Test City
    const res = await request(app)
      .get('/api/courses?is_user_submitted=true&approved=false&city=Unique Test City')
      .set('Authorization', `Bearer ${testSetup.token}`)
      .expect(200);

    expect(res.body.courses).toBeDefined();

    res.body.courses.forEach((course) => {
      expect(course.is_user_submitted).toBe(true);
      expect(course.approved).toBe(false);
      expect(course.city.toLowerCase()).toContain('unique test city');
    });
  });

  test('should find user own courses with is_user_submitted=true filter', async () => {
    // Search for user's own submitted courses using the unique test city
    const res = await request(app)
      .get('/api/courses?is_user_submitted=true&city=Unique Test City')
      .set('Authorization', `Bearer ${testSetup.token}`)
      .expect(200);

    expect(res.body.courses).toBeDefined();
    expect(res.body.courses.length).toBeGreaterThan(0);

    // Should find at least the user's own unapproved course
    const userCourse = res.body.courses.find((c) => c.id === `user-unapproved-${testSetup.testId}`);
    expect(userCourse).toBeDefined();
    expect(userCourse.is_user_submitted).toBe(true);
    expect(userCourse.submitted_by_id).toBe(testSetup.user.id);
  });

  test('should allow searching user courses that can be edited', async () => {
    // A realistic use case: find courses the user can edit
    // (their own user-submitted ones that are not yet approved)
    const res = await request(app)
      .get('/api/courses?is_user_submitted=true&approved=false')
      .set('Authorization', `Bearer ${testSetup.token}`)
      .expect(200);

    expect(res.body.courses).toBeDefined();

    // Should include user's own and friend's courses
    const userCourse = res.body.courses.find((c) => c.submitted_by_id === testSetup.user.id);
    const friendCourse = res.body.courses.find((c) => c.submitted_by_id === testSetup.friend.id);

    if (userCourse) {
      expect(userCourse.is_user_submitted).toBe(true);
      expect(userCourse.approved).toBe(false);
    }

    if (friendCourse) {
      expect(friendCourse.is_user_submitted).toBe(true);
      expect(friendCourse.approved).toBe(false);
    }
  });

  test('should handle case where no courses match boolean filters', async () => {
    // Search for a combination that should return no results
    const res = await request(app)
      .get('/api/courses?is_user_submitted=true&approved=true&city=NonExistentCity')
      .set('Authorization', `Bearer ${testSetup.token}`)
      .expect(200);

    expect(res.body.courses).toBeDefined();
    expect(res.body.courses).toHaveLength(0);
    expect(res.body.total).toBe(0);
  });

  // Validation tests (combined into single test for efficiency)
  test('should return validation errors for invalid boolean values', async () => {
    // Test invalid is_user_submitted value
    const invalidUserSubmittedRes = await request(app)
      .get('/api/courses?is_user_submitted=invalid')
      .set('Authorization', `Bearer ${testSetup.token}`)
      .expect(400);

    expect(invalidUserSubmittedRes.body).toMatchObject({
      success: false,
      message: 'is_user_submitted must be a boolean value (true or false)',
    });

    // Test invalid approved value
    const invalidApprovedRes = await request(app)
      .get('/api/courses?approved=maybe')
      .set('Authorization', `Bearer ${testSetup.token}`)
      .expect(400);

    expect(invalidApprovedRes.body).toMatchObject({
      success: false,
      message: 'approved must be a boolean value (true or false)',
    });

    // Test numeric boolean values
    const numericRes = await request(app)
      .get('/api/courses?is_user_submitted=1')
      .set('Authorization', `Bearer ${testSetup.token}`)
      .expect(400);

    expect(numericRes.body).toMatchObject({
      success: false,
      message: 'is_user_submitted must be a boolean value (true or false)',
    });
  });
});
