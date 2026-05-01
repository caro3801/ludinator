export class UpdatePostName {
  #repo

  constructor(postRepository) {
    this.#repo = postRepository
  }

  async execute({ postId, name }) {
    const post = await this.#repo.findById(postId)
    if (!post) throw new Error(`Post not found: ${postId}`)
    post.updateName(name)
    await this.#repo.save(post)
    return post
  }
}
