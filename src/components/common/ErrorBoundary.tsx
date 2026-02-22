import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router-dom';

export default function ErrorBoundary() {
    const error = useRouteError();
    const navigate = useNavigate();

    let title = 'Something went wrong';
    let message = 'An unexpected error occurred. Please try again.';

    if (isRouteErrorResponse(error)) {
        title = `${error.status} – ${error.statusText}`;
        message = error.data?.message ?? message;
    } else if (error instanceof Error) {
        message = error.message;
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 p-6 text-center">
            <div className="rounded-2xl bg-white p-10 shadow-md max-w-md w-full">
                <div className="mb-4 text-5xl">⚠️</div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">{title}</h1>
                <p className="text-gray-500 mb-6">{message}</p>
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
                    >
                        Go Back
                    </button>
                    <button
                        onClick={() => navigate('/admin/dashboard')}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}
