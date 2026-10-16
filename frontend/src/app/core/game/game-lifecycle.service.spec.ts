import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { FakeGameClient, gameState } from '../../testing/fake-game-client';
import { GameClient } from './game-client.service';
import { GameLifecycleService } from './game-lifecycle.service';
import { GAME_SCREEN_DATA } from './game-screen';

describe('GameLifecycleService', () => {
  let client: FakeGameClient;
  let router: Router;

  function start(): void {
    TestBed.inject(GameLifecycleService).start();
  }

  function setPrerendering(value: boolean | undefined): void {
    Object.defineProperty(document, 'prerendering', {
      configurable: true,
      get: () => value,
    });
  }

  beforeEach(() => {
    client = new FakeGameClient();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', children: [] },
          { path: 'quiz', data: GAME_SCREEN_DATA, children: [] },
          { path: 'result', data: GAME_SCREEN_DATA, children: [] },
          { path: 'admin', children: [] },
        ]),
        { provide: GameClient, useValue: client },
      ],
    });
    router = TestBed.inject(Router);
  });

  afterEach(() => setPrerendering(undefined));

  it('resumes a stored game when the page opens on a game screen', async () => {
    client.storedGame = true;
    start();
    await router.navigateByUrl('/quiz');
    expect(client.calls).toEqual(['resumeStoredGame']);
  });

  it('leaves a stored game when the page opens anywhere else', async () => {
    client.storedGame = true;
    start();
    await router.navigateByUrl('/admin');
    expect(client.calls).toEqual(['leaveStoredGame']);
  });

  it('does nothing on start without a stored game', async () => {
    start();
    await router.navigateByUrl('/quiz');
    expect(client.calls).toEqual([]);
  });

  it('leaves a running game when a non-game screen is shown', async () => {
    start();
    await router.navigateByUrl('/quiz');
    client.state.set(gameState());

    await router.navigateByUrl('/result');
    expect(client.calls).toEqual([]);

    await router.navigateByUrl('/admin');
    expect(client.calls).toEqual(['leave']);
  });

  it('acts on a prerendered page only once it is shown', async () => {
    client.storedGame = true;
    setPrerendering(true);
    start();
    await router.navigateByUrl('/admin');
    expect(client.calls).toEqual([]);

    setPrerendering(false);
    document.dispatchEvent(new Event('prerenderingchange'));
    expect(client.calls).toEqual(['leaveStoredGame']);
  });

  it('suspends the connection when the page is unloaded', async () => {
    start();
    await router.navigateByUrl('/quiz');

    window.dispatchEvent(new Event('pagehide'));
    expect(client.calls).toEqual(['suspend']);

    const restored = new Event('pageshow') as PageTransitionEvent;
    Object.defineProperty(restored, 'persisted', { value: true });
    window.dispatchEvent(restored);
    expect(client.calls).toEqual(['suspend', 'reconnect']);
  });
});
