import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { WalletConnect } from '../../src/web/components/WalletConnect.tsx';
import { CircuitCall } from '../../src/web/components/CircuitCall.tsx';
import { PrivatePackageForm } from '../../src/web/components/PrivatePackageForm.tsx';
afterEach(cleanup);
describe('UI component tests (mocked external callbacks, no real wallet)', () => {
  it('explains absent wallet and does not present a working connect button', () => {
    render(<WalletConnect wallet={{status:'disconnected'}} choices={[]} onConnect={vi.fn()} onDisconnect={vi.fn()} />);
    expect(screen.getByText(/No compatible wallet detected/i)).toBeVisible();
    expect(screen.queryByRole('button',{name:/connect lace/i})).not.toBeInTheDocument();
  });
  it('shows the actual shielded address and lets the user disconnect', () => {
    const disconnect = vi.fn();
    render(<WalletConnect wallet={{status:'connected',name:'Lace',address:'mn_shield-addr_preprod_actual_fixture'}} choices={[]} onConnect={vi.fn()} onDisconnect={disconnect}/>);
    expect(screen.getByText('mn_shield-addr_preprod_actual_fixture')).toBeVisible();
    fireEvent.click(screen.getByRole('button',{name:'Disconnect'}));
    expect(disconnect).toHaveBeenCalledOnce();
  });
  it('disables a busy commit and never labels a transaction ID as confirmed', () => {
    render(<CircuitCall canCommit busy claim={7} onClaim={vi.fn()} onCommit={vi.fn()} stage="pending" txId={'a'.repeat(64)} />);
    expect(screen.getByRole('button',{name:/commit private card/i})).toBeDisabled();
    expect(screen.getByText(/confirmation not yet verified/i)).toBeVisible();
    expect(screen.queryByText(/Proved without revealing your input/)).not.toBeInTheDocument();
  });
  it('shows the exact proved statement only for confirmed data', () => {
    render(<CircuitCall canCommit={false} busy={false} claim={7} onClaim={vi.fn()} onCommit={vi.fn()} stage="confirmed" txId={'a'.repeat(64)} confirmation={{txHash:'b'.repeat(64),blockHeight:123,commitment:'c'.repeat(64)}}/>);
    expect(screen.getByText(/Proved without revealing your input/)).toBeVisible();
    expect(screen.getByText(/authorized.*rank.*1–13/i)).toBeVisible();
    expect(screen.getByRole('link',{name:/view transaction/i})).toHaveAttribute('href',`https://preprod.midnightexplorer.com/transactions/0x${'b'.repeat(64)}`);
  });
  it('clears the passphrase input while importing and never renders file contents', async () => {
    let finish!:()=>void;
    const onImport = vi.fn((_text:string,_password:string)=>new Promise<void>(resolve=>{finish=resolve;}));
    render(<PrivatePackageForm enabled ready={false} onImport={onImport}/>);
    const file = new File(['ENCRYPTED_SENTINEL'], 'cat-bluff-demo.enc.json',{type:'application/json'});
    Object.defineProperty(file,'text',{value:async()=> 'ENCRYPTED_SENTINEL'});
    fireEvent.change(screen.getByLabelText(/encrypted package/i),{target:{files:[file]}});
    fireEvent.change(screen.getByLabelText(/package passphrase/i),{target:{value:'a private passphrase long enough'}});
    fireEvent.click(screen.getByRole('button',{name:/unlock private action/i}));
    await waitFor(()=>expect(onImport).toHaveBeenCalledOnce());
    expect(screen.getByLabelText(/package passphrase/i)).toHaveValue('');
    expect(document.body.innerHTML).not.toContain('ENCRYPTED_SENTINEL');
    finish();
    await waitFor(()=>expect(screen.getByRole('button',{name:/unlock private action/i})).toBeEnabled());
  });
});
