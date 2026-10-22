// TEMPORARY: design concepts for the admin, to choose one (development only).
import { NgComponentOutlet } from '@angular/common';
import { Component, computed, input, type Type } from '@angular/core';
import { ConceptFrameComponent } from './frame.component';
import { CONCEPT_LIST } from './concept-list';

export interface Concept {
  id: string;
  name: string;
  tagline: string;
  idea: string;
  strengths: string[];
  bestFor: string;
  /** What would be new in the backend for this concept. */
  needs?: string;
  screens: { label: string; kind: 'desktop' | 'mobile'; component: Type<unknown> }[];
}

@Component({
  selector: 'app-concepts-page',
  imports: [ConceptFrameComponent, NgComponentOutlet],
  template: `
    @if (single(); as one) {
      <div class="single"><ng-container *ngComponentOutlet="one" /></div>
    } @else {
      <header class="hero">
        <span class="eyebrow">playduelio · Admin</span>
        <h1>Design-Konzepte</h1>
        <p>
          {{ concepts.length }} Richtungen für das Admin – jede mit eigener Idee und
          eigenem Look. Die Screens sind Entwürfe mit Beispielinhalten; ein Klick
          zeigt sie in Originalgrösse. Das gewählte Konzept wird danach vollständig
          umgesetzt.
        </p>
        <nav class="index">
          @for (c of concepts; track c.id; let i = $index) {
            <a [href]="'#' + c.id"
              ><b>{{ i + 1 }}</b
              >{{ c.name }}</a
            >
          }
        </nav>
      </header>

      @for (c of concepts; track c.id; let i = $index) {
        <section class="concept" [id]="c.id">
          <div class="intro">
            <span class="number">{{ i + 1 }}</span>
            <div>
              <h2>{{ c.name }}</h2>
              <p class="tagline">{{ c.tagline }}</p>
            </div>
          </div>
          <div class="body">
            <div class="text">
              <p class="idea">{{ c.idea }}</p>
              <h3>Stärken</h3>
              <ul>
                @for (s of c.strengths; track s) {
                  <li>{{ s }}</li>
                }
              </ul>
              <h3>Passt besonders</h3>
              <p>{{ c.bestFor }}</p>
              @if (c.needs) {
                <p class="needs">{{ c.needs }}</p>
              }
            </div>
            <div class="screens">
              @for (s of c.screens; track s.label; let j = $index) {
                <div class="screen">
                  <app-concept-frame
                    [screen]="s.component"
                    [kind]="s.kind"
                    [label]="s.label"
                    [width]="520"
                  />
                  <a
                    class="direct"
                    [href]="'?screen=' + c.id + '-' + (j + 1)"
                    target="_blank"
                    >Originalgrösse ↗</a
                  >
                </div>
              }
            </div>
          </div>
        </section>
      }
    }
  `,
  styles: `
    :host {
      display: block;
      min-height: 100dvh;
      padding: 0 0 120px;
      background: #f4f5f7;
      color: #00327d;
    }

    .hero {
      padding: 64px 48px 40px;
      background: linear-gradient(180deg, #00327d, #00255e);
      color: #fff;
    }

    .eyebrow {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #8fd3f5;
    }

    .hero h1 {
      margin: 8px 0 12px;
      font-size: 44px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    .hero p {
      max-width: 720px;
      margin: 0;
      font-size: 17px;
      line-height: 1.55;
      color: rgba(255, 255, 255, 0.8);
    }

    .index {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 28px;

      a {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 14px;
        border: 1px solid rgba(255, 255, 255, 0.25);
        border-radius: 20px;
        color: #fff;
        text-decoration: none;

        &:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      }

      b {
        display: grid;
        place-items: center;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #00a4e0;
        font-size: 12px;
      }
    }

    .concept {
      margin: 32px 32px 0;
      padding: 32px;
      border-radius: 20px;
      background: #fff;
      box-shadow: 0 1px 3px rgba(0, 25, 62, 0.06);
      scroll-margin-top: 16px;
    }

    .intro {
      display: flex;
      align-items: center;
      gap: 18px;
      margin-bottom: 24px;
    }

    .number {
      display: grid;
      place-items: center;
      width: 52px;
      height: 52px;
      border-radius: 14px;
      background: #00327d;
      font-size: 24px;
      font-weight: 700;
      color: #fff;
    }

    h2 {
      margin: 0;
      font-size: 30px;
      font-weight: 700;
    }

    .tagline {
      margin: 4px 0 0;
      font-size: 16px;
      color: #4d70a4;
    }

    .body {
      display: grid;
      grid-template-columns: 300px minmax(0, 1fr);
      gap: 32px;
    }

    .text {
      font-size: 15px;
      line-height: 1.55;

      h3 {
        margin: 18px 0 6px;
        font-size: 13px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: #8098be;
      }

      ul {
        margin: 0;
        padding-left: 18px;
      }

      li {
        margin-bottom: 4px;
      }

      p {
        margin: 0;
      }
    }

    .idea {
      font-size: 16px;
    }

    .needs {
      margin-top: 14px !important;
      padding: 10px 12px;
      border-radius: 8px;
      background: #fff6dc;
      font-size: 13px;
      color: #7a5000;
    }

    .single {
      display: inline-block;
      background: #fff;
    }

    .screen {
      position: relative;
    }

    .direct {
      position: absolute;
      right: 0;
      bottom: 0;
      font-size: 12px;
      color: #8098be;
    }

    .screens {
      display: flex;
      flex-wrap: wrap;
      gap: 28px 24px;
      align-items: flex-start;
    }

    @media (max-width: 1100px) {
      .body {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class ConceptsPage {
  protected readonly concepts: Concept[] = CONCEPT_LIST;
  /** One screen alone at its real size, e.g. `?screen=studio-1`. */
  readonly screen = input<string>();
  protected readonly single = computed(() => {
    const key = this.screen();
    if (!key) {
      return null;
    }
    const at = key.lastIndexOf('-');
    const concept = this.concepts.find((c) => c.id === key.slice(0, at));
    return concept?.screens[Number(key.slice(at + 1)) - 1]?.component ?? null;
  });
}
