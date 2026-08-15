import defaultMdxComponents from 'fumadocs-ui/mdx';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import type { MDXComponents } from 'mdx/types';
import { Mermaid } from '@/components/mermaid';
import {
  Endpoint,
  ExitProof,
  OperationContract,
  StatusStamp,
} from '@/components/docs/proof';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Tab,
    Tabs,
    Step,
    Steps,
    Mermaid,
    // Proof components — available in every MDX page without an import, so
    // documenting an operation in full is the path of least resistance and
    // prose is the thing you have to go out of your way to write.
    OperationContract,
    Endpoint,
    ExitProof,
    StatusStamp,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
