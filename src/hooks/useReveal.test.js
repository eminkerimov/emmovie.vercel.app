import { fireEvent, render, screen } from '@testing-library/react';
import useReveal from './useReveal';

const createRect = (top) => ({
  top,
  bottom: top + 200,
  left: 0,
  right: 200,
  width: 200,
  height: 200,
  x: 0,
  y: top,
  toJSON: () => {},
});

const RevealProbe = () => {
  const { elementRef, isVisible } = useReveal();

  return (
    <section ref={elementRef} data-testid='reveal-probe'>
      {isVisible ? 'visible' : 'hidden'}
    </section>
  );
};

describe('useReveal', () => {
  let rectSpy;

  beforeEach(() => {
    window.matchMedia = jest.fn(() => ({ matches: false }));
    window.IntersectionObserver = class IntersectionObserverMock {
      observe() {}

      disconnect() {}
    };

    rectSpy = jest
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockReturnValue(createRect(1200));
  });

  afterEach(() => {
    rectSpy.mockRestore();
    delete window.matchMedia;
    delete window.IntersectionObserver;
  });

  it('reveals content when a large scroll step moves it above the viewport', () => {
    render(<RevealProbe />);

    expect(screen.getByTestId('reveal-probe')).toHaveTextContent('hidden');

    rectSpy.mockReturnValue(createRect(-200));
    fireEvent.scroll(window);

    expect(screen.getByTestId('reveal-probe')).toHaveTextContent('visible');
  });
});
