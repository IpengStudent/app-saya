import { getAccessToken } from '../utils/auth';
import { BASE_URL } from '../config';

const ENDPOINTS = {
  // Auth
  REGISTER: `${BASE_URL}/register`,
  LOGIN: `${BASE_URL}/login`,
  // Dicoding Story API does not have a /users/me endpoint

  // Story
  GET_ALL_STORIES: `${BASE_URL}/stories`,
  GET_STORY_DETAIL: (id) => `${BASE_URL}/stories/${id}`,
  ADD_NEW_STORY: `${BASE_URL}/stories`,
  ADD_NEW_GUEST_STORY: `${BASE_URL}/stories/guest`,

  // Dicoding Story API does not have endpoints for reports or comments

  // Push Notification
  SUBSCRIBE: `${BASE_URL}/notifications/subscribe`,
  UNSUBSCRIBE: `${BASE_URL}/notifications/subscribe`,
  // Specific notification endpoints for reports/comments are not in Dicoding Story API
};

export async function getRegistered({ name, email, password }) {
  const data = JSON.stringify({ name, email, password });

  const fetchResponse = await fetch(ENDPOINTS.REGISTER, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: data,
  });
  const json = await fetchResponse.json();

  return {
    ...json,
    ok: fetchResponse.ok,
  };
}

export async function getLogin({ email, password }) {
  const data = JSON.stringify({ email, password });

  const fetchResponse = await fetch(ENDPOINTS.LOGIN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: data,
  });
  const json = await fetchResponse.json();

  return {
    ...json,
    ok: fetchResponse.ok,
  };
}

// This function is removed as Dicoding Story API does not have a /users/me endpoint
// export async function getMyUserInfo() {
//   const accessToken = getAccessToken();
//
//   const fetchResponse = await fetch(ENDPOINTS.MY_USER_INFO, {
//     headers: { Authorization: `Bearer ${accessToken}` },
//   });
//   const json = await fetchResponse.json();
//
//   return {
//     ...json,
//     ok: fetchResponse.ok,
//   };
// }


export async function getAllStories(params = {}) {
  const accessToken = getAccessToken();
  if (!accessToken) {
      // Handle case where token is not available, maybe redirect to login or fetch without auth if allowed
      console.error("Access token not available for getAllStories");
      // Depending on requirement, you might want to return an error or handle differently
       // For Dicoding Story API, GET /stories requires auth
      return { error: true, message: "Authentication required" };
  }

  const url = new URL(ENDPOINTS.GET_ALL_STORIES);

  // Add optional parameters if provided
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined) {
      url.searchParams.append(key, params[key]);
    }
  });

  const fetchResponse = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const json = await fetchResponse.json();

  return {
    ...json,
    ok: fetchResponse.ok,
  };
}

export async function getStoryById(id) {
  const accessToken = getAccessToken();
   if (!accessToken) {
       console.error("Access token not available for getStoryById");
       // For Dicoding Story API, GET /stories/:id requires auth
       return { error: true, message: "Authentication required" };
   }

  const fetchResponse = await fetch(ENDPOINTS.GET_STORY_DETAIL(id), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const json = await fetchResponse.json();

  return {
    ...json,
    ok: fetchResponse.ok,
  };
}

export async function addNewStory({ description, photo, lat, lon }) {
  const accessToken = getAccessToken();
  if (!accessToken) {
      console.error("Access token not available for addNewStory");
      return { error: true, message: "Authentication required" };
  }

  const formData = new FormData();
  formData.set('description', description);
  formData.append('photo', photo); // 'photo' key as per API docs

  if (lat !== undefined) {
    formData.set('lat', lat);
  }
  if (lon !== undefined) {
    formData.set('lon', lon);
  }

  const fetchResponse = await fetch(ENDPOINTS.ADD_NEW_STORY, {
    method: 'POST',
    headers: {
      // Content-Type: 'multipart/form-data' header is automatically set by the browser when using FormData
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });
  const json = await fetchResponse.json();

  return {
    ...json,
    ok: fetchResponse.ok,
  };
}

export async function addNewGuestStory({ description, photo, lat, lon }) {
  const formData = new FormData();
  formData.set('description', description);
  formData.append('photo', photo); // 'photo' key as per API docs

  if (lat !== undefined) {
    formData.set('lat', lat);
  }
  if (lon !== undefined) {
    formData.set('lon', lon);
  }

  const fetchResponse = await fetch(ENDPOINTS.ADD_NEW_GUEST_STORY, {
    method: 'POST',
     // Content-Type: 'multipart/form-data' header is automatically set by the browser when using FormData
    body: formData,
  });
  const json = await fetchResponse.json();

  return {
    ...json,
    ok: fetchResponse.ok,
  };
}


// Functions related to reports and comments are removed as they are not part of Dicoding Story API

// export async function getAllCommentsByReportId(reportId) { ... }
// export async function storeNewCommentByReportId(reportId, { body }) { ... }


// Notification related functions (assuming they match the Dicoding Story API notification endpoints)
export async function subscribePushNotification({ endpoint, keys: { p256dh, auth } }) {
  const accessToken = getAccessToken();
   if (!accessToken) {
       console.error("Access token not available for subscribePushNotification");
       return { error: true, message: "Authentication required" };
   }

  const data = JSON.stringify({
    endpoint,
    keys: { p256dh, auth },
  });

  const fetchResponse = await fetch(ENDPOINTS.SUBSCRIBE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: data,
  });
  const json = await fetchResponse.json();

  return {
    ...json,
    ok: fetchResponse.ok,
  };
}

export async function unsubscribePushNotification({ endpoint }) {
  const accessToken = getAccessToken();
   if (!accessToken) {
       console.error("Access token not available for unsubscribePushNotification");
       return { error: true, message: "Authentication required" };
   }
  const data = JSON.stringify({
    endpoint,
  });

  const fetchResponse = await fetch(ENDPOINTS.UNSUBSCRIBE, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: data,
  });
  const json = await fetchResponse.json();

  return {
    ...json,
    ok: fetchResponse.ok,
  };
}

// Specific notification functions for reports/comments are removed
// export async function sendReportToMeViaNotification(reportId) { ... }
// export async function sendReportToUserViaNotification(reportId, { userId }) { ... }
// export async function sendReportToAllUserViaNotification(reportId) { ... }
// export async function sendCommentToReportOwnerViaNotification(reportId, commentId) { ... }