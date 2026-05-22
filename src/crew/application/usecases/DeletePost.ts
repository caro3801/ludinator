import { PostDeleted } from '../../domain/events'

export class DeletePost {
  execute({ postId }) {
    return new PostDeleted({ postId })
  }
}
