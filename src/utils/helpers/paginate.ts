import mongoose, { Document, Model, Mongoose } from "mongoose";

export const getPaginatedRecords = async (
  model: any,
  // model: Model<Document>,
  {
    limit = 10,
    page = 1,
    data = {},
    selectedFields,
    sortFilter = [["created_at", -1], ["createdAt", -1]],
    populate,
    populateObj,
    populateObj1,
    populateObj2,
  }: paginateInfo
): Promise<paginateResponse> => {
  try {
    const maxLimit = Math.min(limit, 1000); // restrict limit to 1000
    const offset = 0 + (Math.abs(page || 1) - 1) * maxLimit;

    const modelData = await model.find({ ...data }).countDocuments();

    const result = await model
      .find({ ...data })
      .populate(populate ? populate : "")
      .populate(populateObj ? populateObj : "")
      .populate(populateObj ? populateObj : "")
      .populate(populateObj1 ? populateObj1 : "")
      .populate(populateObj2 ? populateObj2 : "")
      .select(selectedFields ? selectedFields : "")
      .skip(offset)
      .limit(maxLimit)
      .sort(sortFilter);

    const altNoResult: any[] = []
    return {
      data: (Number(modelData) > 0) ? result : altNoResult,
      pagination: {
        pageSize: maxLimit, //number of content yousee per page
        totalCount: modelData, //Total number of records
        pageCount: Math.ceil(modelData / maxLimit), //How many pages will be available
        currentPage: +page, //if you're on page 1 or 18...
        hasNext: page * maxLimit < modelData,
      },
    };
  } catch (err: any) {
    console.log(err);
    return err
  }
};

export interface paginateInfo {
  limit?: number;
  page?: number;
  data?: {};
  selectedFields?: string;
  sortFilter?: [any][any];
  populate?: string;
  populateObj?: any;
  populateObj1?: any;
  populateObj2?: any;

}

export interface paginateResponse {
  data: any[],
  pagination: {
    pageSize: number;
    totalCount: number;
    pageCount: number;
    currentPage: number;
    hasNext: boolean;
  }
}