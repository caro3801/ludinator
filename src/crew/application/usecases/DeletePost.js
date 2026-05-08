import { PostDeleted } from '../../domain/events.js'

export class DeletePost {
  execute({ postId }) {
    return new PostDeleted({ postId })
  }
}
