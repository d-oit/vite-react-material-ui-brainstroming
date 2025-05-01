import { vi } from 'vitest'

export const useNavigate = vi.fn()
export const useLocation = vi.fn(() => ({
	pathname: '/',
	search: '',
	hash: '',
	state: null,
}))

export const useParams = vi.fn(() => ({}))
export const Link = ({ children, to, ...props }: { children: React.ReactNode; to: string; [key: string]: any }) => (
	<a href={to} {...props}>
		{children}
	</a>
)
export const NavLink = Link
export const Navigate = () => null
export const Outlet = () => null

export const useOutletContext = vi.fn()
export const useSearchParams = vi.fn(() => [new URLSearchParams(), vi.fn()])
