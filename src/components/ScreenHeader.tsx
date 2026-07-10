import { SubHeading } from './SubHeading'

export interface ScreenHeaderProps {
  eyebrow: string
  title: string
}

export function ScreenHeader({ eyebrow, title }: ScreenHeaderProps) {
  return (
    <header className="flex flex-col gap-0.5">
      <SubHeading>{eyebrow}</SubHeading>
      <h1 className="text-[22px] font-semibold">{title}</h1>
    </header>
  )
}
