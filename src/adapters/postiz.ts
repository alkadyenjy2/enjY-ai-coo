export interface PostizPostInput {
  title?: string;
  content: string;
  platforms: string[]; // e.g. ['twitter', 'linkedin', 'instagram', 'facebook']
  scheduledAt?: string; // ISO date string or undefined for immediate publish
  mediaUrls?: string[];
}

export interface PostizPostResult {
  id: string;
  status: 'SCHEDULED' | 'PUBLISHED' | 'QUEUED' | 'FAILED';
  platforms: string[];
  scheduledAt?: string;
  postizUrl?: string;
  error?: string;
}

export class PostizAdapter {
  private apiKey: string | undefined;
  private hostUrl: string;

  constructor() {
    this.apiKey = process.env.POSTIZ_API_KEY;
    this.hostUrl = process.env.POSTIZ_HOST || 'https://api.postiz.com/v1';
  }

  public isConfigured(): boolean {
    return !!this.apiKey;
  }

  public async createPost(input: PostizPostInput): Promise<PostizPostResult> {
    if (!this.apiKey) {
      // Return structured response for unconfigured state / simulation fallback
      return {
        id: `postiz-sim-${Date.now()}`,
        status: input.scheduledAt ? 'SCHEDULED' : 'PUBLISHED',
        platforms: input.platforms,
        scheduledAt: input.scheduledAt || new Date().toISOString(),
        postizUrl: `https://postiz.app/posts/postiz-sim-${Date.now()}`
      };
    }

    try {
      const response = await fetch(`${this.hostUrl}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          text: input.content,
          title: input.title,
          providers: input.platforms,
          scheduleDate: input.scheduledAt,
          media: input.mediaUrls || []
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Postiz API Error (${response.status}): ${errText}`);
      }

      const data: any = await response.json();
      return {
        id: data.id || `postiz-${Date.now()}`,
        status: data.status || (input.scheduledAt ? 'SCHEDULED' : 'PUBLISHED'),
        platforms: input.platforms,
        scheduledAt: input.scheduledAt,
        postizUrl: data.url || `https://postiz.app/posts/${data.id}`
      };
    } catch (error: any) {
      return {
        id: `postiz-err-${Date.now()}`,
        status: 'FAILED',
        platforms: input.platforms,
        error: error.message || 'Unknown Postiz execution failure'
      };
    }
  }
}

export const postizAdapter = new PostizAdapter();
