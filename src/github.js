export class Github {
  constructor(env) {
    this.token = env.GITHUB_TOKEN;
    this.username = env.GITHUB_USERNAME || 'eoeoe22';
  }

  getHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': `Cloudflare-Worker-${this.username}`,
      'X-GitHub-Api-Version': '2022-11-28'
    };
  }

  async raw(url, options = {}) {
    const res = await fetch(`https://api.github.com${url}`, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...(options.headers || {})
      }
    });
    if (!res.ok) {
      const err = await res.text();
      console.error(`GitHub API Error (${res.status}) on ${url}:`, err);
      throw new Error(`GitHub API Error: ${res.statusText}`);
    }
    return res.json();
  }

  async getLatestCommitSha(repo, branch = 'main') {
    const res = await this.raw(`/repos/${this.username}/${repo}/git/ref/heads/${branch}`);
    return res.object.sha;
  }

  async getCommitTreeSha(repo, commitSha) {
    const res = await this.raw(`/repos/${this.username}/${repo}/git/commits/${commitSha}`);
    return res.tree.sha;
  }

  async getTreeRecursive(repo, sha) {
    const res = await this.raw(`/repos/${this.username}/${repo}/git/trees/${sha}?recursive=1`);
    if (res.truncated) {
      throw new Error("Tree is too large (truncated). We can't handle it recursively directly.");
    }
    return res.tree;
  }

  async getBlobBuffer(repo, sha) {
    const res = await this.raw(`/repos/${this.username}/${repo}/git/blobs/${sha}`);
    return res.content;
  }

  async uploadBlob(repo, base64Content) {
    const res = await this.raw(`/repos/${this.username}/${repo}/git/blobs`, {
      method: 'POST',
      body: JSON.stringify({
        content: base64Content,
        encoding: 'base64'
      })
    });
    return res.sha;
  }

  async createTree(repo, baseTree, treeArray) {
    const res = await this.raw(`/repos/${this.username}/${repo}/git/trees`, {
      method: 'POST',
      body: JSON.stringify({
        base_tree: baseTree,
        tree: treeArray
      })
    });
    return res.sha;
  }

  async createCommit(repo, message, treeSha, parentSha) {
    const res = await this.raw(`/repos/${this.username}/${repo}/git/commits`, {
      method: 'POST',
      body: JSON.stringify({
        message,
        tree: treeSha,
        parents: [parentSha]
      })
    });
    return res.sha;
  }

  async getRepoInfo(repo) {
    return await this.raw(`/repos/${this.username}/${repo}`);
  }

  async listCommits(repo, branch = 'main', page = 1, perPage = 20) {
    return await this.raw(`/repos/${this.username}/${repo}/commits?sha=${branch}&page=${page}&per_page=${perPage}`);
  }

  async updateRef(repo, branch, commitSha) {
    const res = await this.raw(`/repos/${this.username}/${repo}/git/refs/heads/${branch}`, {
      method: 'PATCH',
      body: JSON.stringify({
        sha: commitSha,
        force: true
      })
    });
    return res.object.sha;
  }
}
