import { describe, it, expect } from 'vitest'
import { Post } from './Post.js'
import { TimeWindow } from './TimeWindow.js'

describe('Post', () => {
  it('creates a post with a name and minimum volunteers', () => {
    const p = Post.create('Accueil', 2)
    expect(p.name.value).toBe('Accueil')
    expect(p.minVolunteers).toBe(2)
    expect(p.id).toBeDefined()
  })

  it('generates unique ids for each post', () => {
    const a = Post.create('Accueil', 1)
    const b = Post.create('Bar', 2)
    expect(a.id).not.toBe(b.id)
  })

  it('rejects an empty name', () => {
    expect(() => Post.create('', 2)).toThrow()
  })

  it('rejects zero minVolunteers', () => {
    expect(() => Post.create('Accueil', 0)).toThrow()
  })

  it('rejects negative minVolunteers', () => {
    expect(() => Post.create('Accueil', -1)).toThrow()
  })

  it('starts with no slots', () => {
    const p = Post.create('Bar', 3)
    expect(p.slots).toHaveLength(0)
  })

  describe('updateName', () => {
    it('updates the post name', () => {
      const post = Post.create('Accueil', 2)
      post.updateName('Entrée')
      expect(post.name.value).toBe('Entrée')
    })

    it('rejects an empty name', () => {
      const post = Post.create('Accueil', 2)
      expect(() => post.updateName('')).toThrow()
    })

    it('rejects a blank name', () => {
      const post = Post.create('Accueil', 2)
      expect(() => post.updateName('   ')).toThrow()
    })
  })

  describe('removeSlot', () => {
    it('removes an existing slot by id', () => {
      const post = Post.create('Accueil', 1)
      const slot = post.addSlot(new TimeWindow('saturday', '09:00', '12:00'))
      post.removeSlot(slot.id)
      expect(post.slots).toHaveLength(0)
    })

    it('does not affect other slots', () => {
      const post = Post.create('Accueil', 1)
      const slot1 = post.addSlot(new TimeWindow('saturday', '09:00', '12:00'))
      const slot2 = post.addSlot(new TimeWindow('saturday', '14:00', '17:00'))
      post.removeSlot(slot1.id)
      expect(post.slots).toHaveLength(1)
      expect(post.slots[0].id).toBe(slot2.id)
    })

    it('is a no-op for an unknown slot id', () => {
      const post = Post.create('Accueil', 1)
      post.addSlot(new TimeWindow('saturday', '09:00', '12:00'))
      expect(() => post.removeSlot('unknown')).not.toThrow()
      expect(post.slots).toHaveLength(1)
    })
  })

  describe('updateSlotWindow', () => {
    it('updates the window of an existing slot', () => {
      const post = Post.create('Accueil', 1)
      const slot = post.addSlot(new TimeWindow('saturday', '09:00', '12:00'))
      post.updateSlotWindow(slot.id, new TimeWindow('sunday', '10:00', '14:00'))

      expect(post.slots[0].window.day).toBe('sunday')
      expect(post.slots[0].window.startTime).toBe('10:00')
    })

    it('throws when slot id is not found', () => {
      const post = Post.create('Accueil', 1)
      expect(() =>
        post.updateSlotWindow('unknown', new TimeWindow('saturday', '09:00', '12:00'))
      ).toThrow()
    })
  })
})
