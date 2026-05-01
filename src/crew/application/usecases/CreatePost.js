import { Post } from '../../domain/model/Post.js'

export class CreatePost {
  #repo

  constructor(postRepository) {
    this.#repo = postRepository
  }

  async execute({ name, minVolunteers }) {
    const post = Post.create(name, minVolunteers)
    await this.#repo.save(post)
    return post
  }
}
