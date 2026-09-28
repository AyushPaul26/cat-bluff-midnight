import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { WalletConnect } from '../../src/web/components/WalletConnect.tsx';
import { CircuitCall } from '../../src/web/components/CircuitCall.tsx';
import { PrivatePackageForm } from '../../src/web/components/PrivatePackageForm.tsx';
afterEach(cleanup);
describe('UI component tests (mocked external callbacks, no real wallet)', () => {
  it('explains absent wallet and does not present a working connect button', () => {
    render(<WalletConnect wallet={{status:'disconnected'}} choices={[]} onConnect={vi.fn()} onDisconnect={vi.fn()} onGetFaucetAddress={async()=>''} />);
    expect(screen.getByText(/No compatible wallet detected/i)).toBeVisible();
    expect(screen.queryByRole('button',{name:/connect lace/i})).not.toBeInTheDocument();
  });
  it('shows a readable support code only while that connection error is current', () => {
    const props={choices:[],onConnect:vi.fn(),onDisconnect:vi.fn(),onGetFaucetAddress:async()=>''};
    const failure={status:'error' as const,reason:'Wallet connection failed',diagnostic:'connect.authorize/PermissionRejected' as const};
    const view=render(<WalletConnect {...props} wallet={failure}/>);
    expect(screen.getByRole('alert')).toHaveTextContent('Support code: connect.authorize/PermissionRejected');
    expect(screen.getByText('connect.authorize/PermissionRejected').tagName).toBe('CODE');
    view.rerender(<WalletConnect {...props} wallet={{status:'connecting',name:'Lace'}}/>);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByText(/Support code:/)).not.toBeInTheDocument();
    view.rerender(<WalletConnect {...props} wallet={{status:'connected',name:'Lace',address:'shielded-fixture'}}/>);
    expect(screen.queryByText(/Support code:/)).not.toBeInTheDocument();
    view.rerender(<WalletConnect {...props} wallet={{status:'disconnected'}}/>);
    expect(screen.queryByText(/Support code:/)).not.toBeInTheDocument();
  });
  it('keeps legacy errors readable when no support code is available', () => {
    render(<WalletConnect wallet={{status:'error',reason:'Wallet connection failed'}} choices={[]} onConnect={vi.fn()} onDisconnect={vi.fn()} onGetFaucetAddress={async()=>''}/>);
    expect(screen.getByRole('alert')).toHaveTextContent('Wallet connection failed.');
    expect(screen.queryByText(/Support code:/)).not.toBeInTheDocument();
  });
  it('shows the actual shielded address and lets the user disconnect', () => {
    const disconnect = vi.fn();
    render(<WalletConnect wallet={{status:'connected',name:'Lace',address:'mn_shield-addr_preprod_actual_fixture'}} choices={[]} onConnect={vi.fn()} onDisconnect={disconnect} onGetFaucetAddress={async()=>''}/>);
    expect(screen.getByText('mn_shield-addr_preprod_actual_fixture')).toBeVisible();
    fireEvent.click(screen.getByRole('button',{name:'Disconnect'}));
    expect(disconnect).toHaveBeenCalledOnce();
  });
  it('reads and copies the returned faucet address only after an explicit request', async () => {
    const address='mn_addr_preprod1_public_ui_fixture';
    const read=vi.fn(async()=>address);
    const copy=vi.fn(async()=>{});
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:copy}});
    render(<WalletConnect wallet={{status:'connected',name:'Lace',address:'shielded-fixture'}} choices={[]} onConnect={vi.fn()} onDisconnect={vi.fn()} onGetFaucetAddress={read}/>);
    expect(read).not.toHaveBeenCalled();
    expect(screen.queryByRole('button',{name:'Copy faucet address'})).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Show faucet address'}));
    expect(await screen.findByText(address)).toBeVisible();
    fireEvent.click(screen.getByRole('button',{name:'Copy faucet address'}));
    await waitFor(()=>expect(screen.getByText('Faucet address copied')).toBeVisible());
    expect(copy).toHaveBeenCalledWith(address);
    expect(screen.getByRole('link',{name:'Open free Preprod faucet ↗'})).toHaveAttribute('href','https://midnight-tmnight-preprod.nethermind.dev/');
  });
  it('deduplicates a pending address request and discards it on disconnect', async () => {
    let finish!:(address:string)=>void;
    const read=vi.fn(()=>new Promise<string>(resolve=>{finish=resolve;}));
    const props={choices:[],onConnect:vi.fn(),onDisconnect:vi.fn(),onGetFaucetAddress:read};
    const view=render(<WalletConnect {...props} wallet={{status:'connected',name:'Lace',address:'shielded-fixture'}}/>);
    fireEvent.click(screen.getByRole('button',{name:'Show faucet address'}));
    fireEvent.click(screen.getByRole('button',{name:'Reading wallet…'}));
    expect(read).toHaveBeenCalledOnce();
    view.rerender(<WalletConnect {...props} wallet={{status:'disconnected'}}/>);
    finish('STALE_ADDRESS_SENTINEL');
    await waitFor(()=>expect(screen.getByText(/No compatible wallet detected/)).toBeVisible());
    expect(document.body.innerHTML).not.toContain('STALE_ADDRESS_SENTINEL');
    expect(screen.queryByRole('button',{name:'Copy faucet address'})).not.toBeInTheDocument();
  });
  it('sanitizes faucet address failures and permits retry', async () => {
    const read=vi.fn(async()=>{throw new Error('PRIVATE_ERROR_SENTINEL');});
    render(<WalletConnect wallet={{status:'connected',name:'Lace',address:'shielded-fixture'}} choices={[]} onConnect={vi.fn()} onDisconnect={vi.fn()} onGetFaucetAddress={read}/>);
    fireEvent.click(screen.getByRole('button',{name:'Show faucet address'}));
    expect(await screen.findByRole('alert')).toHaveTextContent(/Could not read the Preprod faucet address/);
    expect(document.body.innerHTML).not.toContain('PRIVATE_ERROR_SENTINEL');
    expect(screen.getByRole('button',{name:'Show faucet address'})).toBeEnabled();
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
    expect(screen.getByText('c'.repeat(64))).toBeVisible();
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
