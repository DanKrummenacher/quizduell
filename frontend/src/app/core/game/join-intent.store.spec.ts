import { TestBed } from '@angular/core/testing';
import { JoinIntentStore } from './join-intent.store';

describe('JoinIntentStore', () => {
  let store: JoinIntentStore;

  beforeEach(() => {
    store = TestBed.inject(JoinIntentStore);
  });

  it('keeps a valid code from an invitation link until it is taken', () => {
    store.setFromLink(' k7qx ');
    expect(store.code()).toBe('K7QX');
    expect(store.take()).toBe('K7QX');
    expect(store.code()).toBeNull();
  });

  it.each(['', 'ABC', 'AB0X', 'TOOLONG', null, undefined])('ignores %j', (raw) => {
    store.setFromLink(raw);
    expect(store.code()).toBeNull();
  });
});
