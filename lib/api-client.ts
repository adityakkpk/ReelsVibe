import { IVideo } from "@/models/Video";

type FetchOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: any;
};

export type VideoFormDate = Omit<IVideo, "_id">

class ApiClient {
  private async fetch<T>(
    endpoint: string,
    options: FetchOptions = {}
  ): Promise<T> {
    const { method = "GET", headers = {}, body } = options;

    const response = await fetch(`api${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "API request failed");
    }

    return response.json();
  }

  async getVideos() {
    return this.fetch<IVideo[]>("/videos");
  }

  async getVideoById(id: string) {
    return this.fetch<IVideo>(`/videos/${id}`);
  }

  async createVideo(video: VideoFormDate) {
    return this.fetch<IVideo>("/videos", {
      method: "POST",
      body: video,
    });
  }
}

export const apiClient = new ApiClient(); 