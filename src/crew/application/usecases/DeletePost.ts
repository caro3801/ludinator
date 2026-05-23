import { PostDeleted } from '../../domain/events'
import { PostId } from '../../../shared/types'

interface DeletePostParams {
  postId: PostId
}

export class DeletePost {
  execute({ postId }: DeletePostParams): PostDeleted {
    return new PostDeleted({ postId })
  }
}
