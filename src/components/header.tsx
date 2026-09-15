"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { List, X } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { nav } from "@/lib/site";
import { Wordmark } from "@/components/wordmark";

function NavLinks({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  return nav.map(([label, href]) => (
    <Link
      key={href}
      href={href}
      className={pathname.startsWith(href) ? "nav-link is-active" : "nav-link"}
      data-mobile={mobile || undefined}
    >
      {label}
    </Link>
  ));
}

export function Header() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Wordmark />
        <nav className="desktop-nav" aria-label="Primary navigation">
          <NavLinks />
        </nav>
        <Link className="button button-compact desktop-contact" href="/contact">
          Contact
        </Link>
        <Dialog.Root>
          <Dialog.Trigger className="menu-trigger" aria-label="Open navigation">
            <List size={22} weight="bold" />
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="menu-overlay" />
            <Dialog.Content className="menu-panel">
              <div className="menu-top">
                <Dialog.Title className="eyebrow">Navigate</Dialog.Title>
                <Dialog.Close className="menu-trigger" aria-label="Close navigation">
                  <X size={22} />
                </Dialog.Close>
              </div>
              <nav className="mobile-nav" aria-label="Mobile navigation">
                <NavLinks mobile />
                <Link className="nav-link" data-mobile href="/contact">Contact</Link>
              </nav>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </header>
  );
}
