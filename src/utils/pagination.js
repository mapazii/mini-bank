const paginateResults = (data, total, page, limit) => {
    const totalPages = Math.ceil(total / limit);

    return {
        data,
        meta: {
            page,
            limit,
            total,
            totalPages
        }
    };
};

module.exports = { paginateResults };