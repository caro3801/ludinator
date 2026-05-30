import { PostRepository } from '../../ports/PostRepository'
import { Post } from '../../domain/model/Post'
import { PostNameUpdated } from '../../domain/events'
import { PostId } from '../../../shared/types'

interface UpdatePostNameByIdParams {
  postId: PostId
  name: string
}

export class UpdatePostNameById {
  constructor(private postRepo: PostRepository) {}

  async execute({ postId, name }: UpdatePostNameByIdParams): Promise<PostNameUpdated> {
    const post = await this.postRepo.findById(postId)
    if (!post) {
      throw new Error('Post not found')
    }
    post.updateName(name)
    await this.postRepo.save(post)
    return new PostNameUpdated({ post: post.toJSON() })
  }
}
