"use client";

import { useEffect } from "react";

export default function SessionGuard() {
  useEffect(() => {
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      if (response.status === 401 && window.location.pathname !== "/login") {
        localStorage.removeItem("bingo_access_token");
        localStorage.removeItem("bingo_user");
        window.location.assign("/login");
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
