"use client";

import { useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Shield, Sparkles, Workflow } from "lucide-react";
import DarkVeil from "./components/DarkVeil";

export default function Landing() {
  const { ready, authenticated, login } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && authenticated) {
      router.replace("/workflow");
    }
  }, [ready, authenticated, router]);

  const handlePrimary = async () => {
    console.log('Button clicked - Ready:', ready, 'Authenticated:', authenticated);
    
    if (!ready) {
      console.log('Privy not ready yet');
      return;
    }
    
    if (!authenticated) {
      try {
        console.log('Attempting to login...');
        await login();
      } catch (e) {
        console.error('Login failed:', e);
      }
    } else {
      console.log('Already authenticated, navigating to workflow');
      router.push("/workflow");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0">
        <DarkVeil />
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden justify-center flex items-center h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
                Automate DeFi across chains with AI-powered workflows
              </h1>
              <p className="text-lg text-foreground/70 mb-8">
                Build make.com-style flows for Web3. Research wallets and
                tokens, add conditions, and trigger staking or swaps on Sui and
                Oasis.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handlePrimary}
                  disabled={!ready}
                  className="inline-flex items-center space-x-2 px-5 py-3 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>
                    {!ready 
                      ? "Loading..." 
                      : authenticated 
                        ? "Enter App" 
                        : "Connect Wallet to Start"
                    }
                  </span>
                </button>
                <Link
                  href="/workflow"
                  className="inline-flex items-center space-x-2 px-5 py-3 rounded-lg border border-border hover:bg-hover text-foreground transition-colors"
                >
                  <Workflow className="w-4 h-4" />
                  <span>View Workflows</span>
                </Link>
              </div>

              <div className="mt-10 grid sm:grid-cols-3 gap-4">
                <Feature
                  icon={<Shield className="w-4 h-4" />}
                  title="Embedded wallets"
                  desc="zkLogin (Sui) & Privy (Oasis)"
                />
                <Feature
                  icon={<Sparkles className="w-4 h-4" />}
                  title="AI insights"
                  desc="Gemini-driven analysis"
                />
                <Feature
                  icon={<Workflow className="w-4 h-4" />}
                  title="Drag-and-drop"
                  desc="Blocks for wallet, token, DeFi"
                />
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="rounded-xl  p-6 flex flex-col items-center justify-center">
                <Image
                  src="/aquanode-logo.svg"
                  alt="AquaNode"
                  width={400}
                  height={140}
                  className="opacity-90"
                />
                <div className="mt-6 text-foreground/70 text-sm">
                  Ship faster: start with templates, customize blocks, and
                  schedule with cron.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Feature({ icon, title, desc }) {
  return (
    <div className="flex items-center space-x-3 p-3 rounded-lg border border-border bg-card/60">
      <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-foreground/60">{desc}</p>
      </div>
    </div>
  );
}
