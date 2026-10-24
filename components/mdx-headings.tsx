import { Children, cloneElement, createElement, isValidElement, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { Heading } from 'fumadocs-ui/components/heading';
import { LinkIcon } from 'lucide-react';

type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

function containsLink(children: ReactNode): boolean {
  return Children.toArray(children).some(child => {
    if (!isValidElement<{ href?: string; children?: ReactNode }>(child)) return false;
    return typeof child.props.href === 'string' || containsLink(child.props.children);
  });
}

export function headingLabel(children: ReactNode): ReactNode {
  return Children.map(children, child => {
    if (!isValidElement<{ href?: string; children?: ReactNode }>(child)) return child;
    const label = headingLabel(child.props.children);
    return typeof child.props.href === 'string' ? label : cloneElement(child, { children: label });
  });
}

function heading(as: HeadingTag) {
  return function MdxHeading({ children, ...props }: ComponentPropsWithoutRef<'h1'>) {
    if (!props.id || !containsLink(children)) return <Heading as={as} {...props}>{children}</Heading>;
    // Fumadocs wraps the whole heading in an anchor. Skill titles can contain
    // reference links; give those headings a sibling permalink instead.
    return createElement(as, { ...props, className: `group/heading scroll-m-28 ${props.className ?? ''}` },
      <span>{children}</span>,
      <a href={`#${props.id}`} aria-label="链接到此标题" className="not-prose ms-1 inline-flex align-middle text-fd-muted-foreground opacity-0 transition-opacity group-hover/heading:opacity-100 focus:opacity-100">
        <LinkIcon className="size-3.5" />
      </a>,
    );
  };
}

export const mdxHeadings = {
  h1: heading('h1'), h2: heading('h2'), h3: heading('h3'),
  h4: heading('h4'), h5: heading('h5'), h6: heading('h6'),
};
