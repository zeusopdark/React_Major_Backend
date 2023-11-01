class ApiFeatures {
    constructor(query, queryStr) {
        this.query = query;
        this.queryStr = queryStr    //link me ? ke baad wala data 
    }

    search() {
        const keyword = this.queryStr.keyword ? {
            name: { //so on behalf of name it will search
                $regex: this.queryStr.keyword,  //what is searched
                $options: "i", //case insensitive
            },
        }
            : {};
        this.query = this.query.find({ ...keyword });
        return this;
    }
    filter() {
        const queryCopy = { ...this.queryStr }
        // console.log(queryCopy);
        //Removing some fields for category

        const removeFields = ["keyword", "page", "limit"];  //category not mentioned to get only the category

        removeFields.forEach(key => delete queryCopy[key]);
        // console.log(queryCopy);
        //Filter for Price and Rating
        let queryStr = JSON.stringify(queryCopy)
        // console.log(queryStr)
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (key) => `$${key}`); //greater than gt   less than lt  lte is nothing but less than or equal to .

        // console.log(queryStr)

        this.query = this.query.find(JSON.parse(queryStr));
        return this;

    }
    pagination(resultPerPage) {
        const currentPage = Number(this.queryStr.page) || 1;  // 50 products per page 10 products than total number of page are 5
        const skip = resultPerPage * (currentPage - 1);

        this.query = this.query.limit(resultPerPage).skip(skip);

        return this
    }
}
module.exports = ApiFeatures