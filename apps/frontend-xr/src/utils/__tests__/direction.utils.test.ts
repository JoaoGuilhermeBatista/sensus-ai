import { describe, it, expect } from 'vitest'
import { computeDirection, buildDirectionalMessage } from '../direction.utils'
import type { ObjetoDetectado } from '../../types/ObjetoDetectado'

// ─── Helpers ────────────────────────────────────────────────────────────────

function mkObj(
  nome: string,
  distancia: 'perto' | 'medio' | 'longe',
  bboxX?: number,
  bboxWidth?: number,
): ObjetoDetectado {
  return {
    nome,
    distancia,
    isClose: distancia === 'perto',
    bboxX,
    bboxWidth,
  }
}

// ─── computeDirection ────────────────────────────────────────────────────────

describe('computeDirection', () => {
  describe('left third (centerX < 0.33)', () => {
    it('object fully on the left returns esquerda', () => {
      // bbox at x=0.0, width=0.2 → centerX=0.1
      expect(computeDirection(mkObj('chair', 'perto', 0.0, 0.2))).toBe('esquerda')
    })

    it('object centered at exactly 0.32 returns esquerda', () => {
      // x=0.22, w=0.20 → center=0.32
      expect(computeDirection(mkObj('person', 'medio', 0.22, 0.20))).toBe('esquerda')
    })
  })

  describe('right third (centerX > 0.67)', () => {
    it('object fully on the right returns direita', () => {
      // bbox at x=0.7, width=0.2 → centerX=0.8
      expect(computeDirection(mkObj('chair', 'longe', 0.7, 0.2))).toBe('direita')
    })

    it('object centered at exactly 0.68 returns direita', () => {
      expect(computeDirection(mkObj('table', 'medio', 0.58, 0.20))).toBe('direita')
    })
  })

  describe('center third (0.33 ≤ centerX ≤ 0.67)', () => {
    it('object centered at 0.5 returns centro', () => {
      // x=0.4, w=0.2 → center=0.5
      expect(computeDirection(mkObj('person', 'perto', 0.4, 0.2))).toBe('centro')
    })

    it('object centered at 0.35 (just inside center zone) returns centro', () => {
      // x=0.25, w=0.20 → centerX=0.35, which is > 1/3 (0.333...)
      expect(computeDirection(mkObj('person', 'perto', 0.25, 0.20))).toBe('centro')
    })

    it('object centered at 0.65 (just inside center zone) returns centro', () => {
      // x=0.55, w=0.20 → centerX=0.65, which is < 2/3 (0.666...)
      expect(computeDirection(mkObj('person', 'perto', 0.55, 0.20))).toBe('centro')
    })
  })

  describe('missing bbox', () => {
    it('returns null when bboxX is missing', () => {
      expect(computeDirection(mkObj('person', 'perto', undefined, 0.2))).toBeNull()
    })

    it('returns null when bboxWidth is missing', () => {
      expect(computeDirection(mkObj('person', 'perto', 0.4, undefined))).toBeNull()
    })

    it('returns null when both bbox fields are missing', () => {
      expect(computeDirection(mkObj('person', 'perto'))).toBeNull()
    })
  })

  describe('boundary edge cases', () => {
    it('bbox at far left edge (x=0, w=0)', () => {
      // centerX = 0 → esquerda
      expect(computeDirection(mkObj('chair', 'perto', 0, 0))).toBe('esquerda')
    })

    it('bbox at far right edge (x=0.9, w=0.1)', () => {
      // centerX = 0.95 → direita
      expect(computeDirection(mkObj('chair', 'perto', 0.9, 0.1))).toBe('direita')
    })
  })
})

// ─── buildDirectionalMessage ─────────────────────────────────────────────────

describe('buildDirectionalMessage', () => {
  describe('perto (isClose=true)', () => {
    it('includes "Atenção!" prefix', () => {
      expect(buildDirectionalMessage(mkObj('person', 'perto', 0.4, 0.2))).toMatch(/^Atenção!/)
    })

    it('includes "muito próxima"', () => {
      expect(buildDirectionalMessage(mkObj('chair', 'perto', 0.4, 0.2))).toContain('muito próxima')
    })

    it('includes direction "à frente" when centered', () => {
      const msg = buildDirectionalMessage(mkObj('person', 'perto', 0.4, 0.2))
      expect(msg).toContain('à frente')
    })

    it('includes direction "à esquerda"', () => {
      const msg = buildDirectionalMessage(mkObj('person', 'perto', 0.0, 0.2))
      expect(msg).toContain('à esquerda')
    })

    it('includes direction "à direita"', () => {
      const msg = buildDirectionalMessage(mkObj('person', 'perto', 0.7, 0.2))
      expect(msg).toContain('à direita')
    })

    it('omits direction phrase when bbox is missing', () => {
      const msg = buildDirectionalMessage(mkObj('person', 'perto'))
      expect(msg).not.toContain('à frente')
      expect(msg).not.toContain('à esquerda')
      expect(msg).not.toContain('à direita')
    })
  })

  describe('medio (isClose=false)', () => {
    it('includes "distância média"', () => {
      const msg = buildDirectionalMessage(mkObj('dining table', 'medio', 0.4, 0.2))
      expect(msg).toContain('distância média')
    })

    it('includes direction', () => {
      const msg = buildDirectionalMessage(mkObj('dining table', 'medio', 0.0, 0.2))
      expect(msg).toContain('à esquerda')
    })

    it('does NOT include "Atenção!"', () => {
      expect(buildDirectionalMessage(mkObj('mesa', 'medio', 0.4, 0.2))).not.toContain('Atenção!')
    })
  })

  describe('longe (isClose=false)', () => {
    it('includes "detectada"', () => {
      const msg = buildDirectionalMessage(mkObj('cell phone', 'longe', 0.4, 0.2))
      expect(msg).toContain('detectada')
    })

    it('does NOT include "muito próxima"', () => {
      expect(buildDirectionalMessage(mkObj('garrafa', 'longe', 0.4, 0.2))).not.toContain('muito próxima')
    })

    it('includes direction "à direita"', () => {
      const msg = buildDirectionalMessage(mkObj('laptop', 'longe', 0.7, 0.2))
      expect(msg).toContain('à direita')
    })
  })

  describe('PT translations in messages', () => {
    it('translates person → pessoa', () => {
      expect(buildDirectionalMessage(mkObj('person', 'perto', 0.4, 0.2))).toContain('pessoa')
    })

    it('translates chair → cadeira', () => {
      expect(buildDirectionalMessage(mkObj('chair', 'medio', 0.4, 0.2))).toContain('cadeira')
    })

    it('translates dining table → mesa', () => {
      expect(buildDirectionalMessage(mkObj('dining table', 'longe', 0.4, 0.2))).toContain('mesa')
    })

    it('translates cell phone → celular', () => {
      expect(buildDirectionalMessage(mkObj('cell phone', 'longe', 0.4, 0.2))).toContain('celular')
    })

    it('uses original name for unknown objects', () => {
      expect(buildDirectionalMessage(mkObj('unknown_thing', 'longe', 0.4, 0.2))).toContain('unknown_thing')
    })
  })
})
