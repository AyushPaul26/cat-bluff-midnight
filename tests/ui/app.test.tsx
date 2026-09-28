import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
const state=vi.hoisted(()=>({config:null,error:null,wallet:{status:'disconnected'},choices:[],publicState:null,publicLoading:false,privateReady:false,busy:false,stage:null,result:null,pending:null,connect:vi.fn(),disconnect:vi.fn(),importPackage:vi.fn(),commit:vi.fn(),recheck:vi.fn(),refresh:vi.fn()}));
vi.mock('../../src/web/useMidnight.ts',()=>({useMidnight:()=>state}));
import App from '../../src/web/App.tsx';
afterEach(cleanup);
describe('screen (mocked hook; no real wallet)',()=>{
 it('does not fabricate a ready contract or successful privacy proof',()=>{
  render(<App/>);
  expect(screen.getByRole('heading',{name:/a little mystery/i})).toBeInTheDocument();
  expect(screen.getByRole('button',{name:/commit private card/i})).toBeDisabled();
  expect(screen.queryByText('Proved without revealing your input')).not.toBeInTheDocument();
  expect(screen.getByText(/checking deployment configuration/i)).toBeInTheDocument();
 });
 it('includes a first-use guide and honest one-round limitation',()=>{
  render(<App/>);
  expect(screen.getByText(/one round. one private action./i)).toBeInTheDocument();
  expect(screen.getByText(/your local proof server/i)).toBeInTheDocument();
  expect(screen.getByRole('button',{name:/enable sound/i})).toHaveAttribute('aria-pressed','false');
 });
});
