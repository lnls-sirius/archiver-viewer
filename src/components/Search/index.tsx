import React, { useState } from "react";
import handlers from "../../lib/handlers";
import * as S from "./styled";

const Search: React.FC = () => {
  const [value, setValue] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const handleSubmit = (e: React.KeyboardEvent) => {
    handlers.queryPVsRetrieval(e, value);
  };

  return (
    <S.Input type="text" placeholder="Search ..." value={value} onChange={handleChange} onKeyDown={handleSubmit} />
  );
};
export default Search;
