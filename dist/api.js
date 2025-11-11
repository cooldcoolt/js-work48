export const postMessage12 = async (url, method, searchParams) => {
    try {
        const res = await fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: searchParams ? searchParams.toString() : null,
        });
        if (!res.ok) {
            throw new Error(`Ошибка запроса: ${res.status} ${res.statusText}`);
        }
        const result = await res.json();
        console.log("postMessage1 response:", result);
        return result;
    }
    catch (error) {
        console.error("Ошибка при отправке сообщения:", error);
        throw error;
    }
};
